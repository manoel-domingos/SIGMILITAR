import { createHash } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const BUCKET = 'signed-documents';
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

function supabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL!;
}

function serviceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY!;
}

function adminClient() {
  return createClient(supabaseUrl(), serviceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

async function findUpload(token: string) {
  const supabaseAdmin = adminClient();
  const { data, error } = await supabaseAdmin
    .from('signed_document_uploads')
    .select('id, school_id, occurrence_id, student_id, expires_at, used_at, storage_path')
    .eq('token_hash', hashToken(token))
    .maybeSingle();

  if (error) throw error;
  return data;
}

function uploadStatus(upload: any) {
  if (!upload) return 'invalido';
  if (upload.used_at) return 'enviado';
  if (new Date(upload.expires_at).getTime() < Date.now()) return 'expirado';
  return 'pendente';
}

async function buildOccurrenceSummary(upload: any) {
  if (!upload) return null;
  const supabaseAdmin = adminClient();
  const { data: occ } = await supabaseAdmin
    .from('occurrences')
    .select('ata_number, rule_code, student_id, student_ids, school_id')
    .eq('id', upload.occurrence_id)
    .maybeSingle();
  if (!occ) return null;

  const studentIds = Array.isArray(occ.student_ids) && occ.student_ids.length > 0
    ? occ.student_ids
    : [occ.student_id].filter(Boolean);
  const ruleCodes = Array.isArray(occ.rule_code) ? occ.rule_code : [occ.rule_code].filter((c: any) => c != null);

  const [{ data: students }, { data: rules }] = await Promise.all([
    supabaseAdmin.from('students').select('id, name, display_name, class').in('id', studentIds.length ? studentIds : ['']),
    supabaseAdmin.from('rules').select('code, description').eq('school_id', occ.school_id).in('code', ruleCodes.length ? ruleCodes : [-1]),
  ]);

  const studentNames = (students || []).map((s: any) => s.display_name || s.name).filter(Boolean);
  const studentClass = (students || [])[0]?.class || '';
  const infractions = ruleCodes.map((code: number) => {
    const r = (rules || []).find((x: any) => x.code === code);
    return `Art. ${code}${r?.description ? ' — ' + r.description : ''}`;
  });

  return {
    ata_number: occ.ata_number || null,
    student_name: studentNames.join(', '),
    student_class: studentClass,
    infractions,
  };
}

export async function GET(req: NextRequest) {
  try {
    if (!supabaseUrl() || !serviceRoleKey()) return jsonError('Supabase nao configurado.', 500);
    const token = req.nextUrl.searchParams.get('token') || '';
    if (!token) return jsonError('token obrigatorio.', 400);

    const upload = await findUpload(token);
    const status = uploadStatus(upload);
    const occurrence = status === 'invalido' ? null : await buildOccurrenceSummary(upload);
    return NextResponse.json({
      status,
      expires_at: upload?.expires_at || null,
      used_at: upload?.used_at || null,
      occurrence,
    }, { status: status === 'invalido' ? 404 : 200 });
  } catch (error: any) {
    return jsonError(error.message || 'Erro ao consultar link.', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!supabaseUrl() || !serviceRoleKey()) return jsonError('Supabase nao configurado.', 500);

    const form = await req.formData();
    const token = String(form.get('token') || '');
    const file = form.get('file');
    if (!token) return jsonError('token obrigatorio.', 400);
    if (!(file instanceof File)) return jsonError('Arquivo obrigatorio.', 400);
    if (!ALLOWED_TYPES[file.type]) return jsonError('Formato permitido: PDF, JPG ou PNG.', 400);
    if (file.size > MAX_BYTES) return jsonError('Arquivo deve ter ate 10MB.', 400);

    const supabaseAdmin = adminClient();
    const upload = await findUpload(token);
    const status = uploadStatus(upload);
    if (!upload || status === 'invalido') return jsonError('Token invalido.', 404);
    if (status === 'expirado') return jsonError('Link expirado.', 410);
    if (status === 'enviado') return jsonError('Documento ja enviado.', 409);

    const ext = ALLOWED_TYPES[file.type];
    const storagePath = `${upload.school_id}/${upload.occurrence_id}/${upload.id}.${ext}`;
    const { error: storageError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(storagePath, file, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (storageError) return jsonError(storageError.message, 400);

    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, 60 * 60 * 24 * 365 * 10);

    if (signedUrlError) return jsonError(signedUrlError.message, 400);

    const { data: occurrence, error: occurrenceError } = await supabaseAdmin
      .from('occurrences')
      .select('signed_doc_urls')
      .eq('id', upload.occurrence_id)
      .eq('school_id', upload.school_id)
      .maybeSingle();

    if (occurrenceError) return jsonError(occurrenceError.message, 400);
    const currentUrls = Array.isArray(occurrence?.signed_doc_urls) ? occurrence.signed_doc_urls : [];
    const documentUrl = signedUrlData.signedUrl || storagePath;

    const { error: occurrenceUpdateError } = await supabaseAdmin
      .from('occurrences')
      .update({ signed_doc_urls: [...currentUrls, documentUrl] })
      .eq('id', upload.occurrence_id)
      .eq('school_id', upload.school_id);

    if (occurrenceUpdateError) return jsonError(occurrenceUpdateError.message, 400);

    const usedAt = new Date().toISOString();
    const { error: uploadUpdateError } = await supabaseAdmin
      .from('signed_document_uploads')
      .update({ storage_path: storagePath, used_at: usedAt })
      .eq('id', upload.id)
      .is('used_at', null);

    if (uploadUpdateError) return jsonError(uploadUpdateError.message, 400);

    return NextResponse.json({
      status: 'enviado',
      storage_path: storagePath,
      url: documentUrl,
      used_at: usedAt,
    });
  } catch (error: any) {
    return jsonError(error.message || 'Erro ao enviar documento.', 500);
  }
}
