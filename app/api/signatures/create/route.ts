import { NextRequest, NextResponse } from 'next/server';
import {
  bearerToken,
  buildSignatureUrl,
  buildWhatsappUrl,
  createSignatureToken,
  getSignatureSupabaseAdmin,
  getSignatureSupabaseUser,
  hashSignatureToken,
  normalizePhone,
  renderOccurrenceDocumentHtml,
  siteOrigin,
} from '@/lib/signatures';

export const dynamic = 'force-dynamic';

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

async function requireAuthenticated(req: NextRequest) {
  const token = bearerToken(req.headers.get('authorization'));
  if (!token) return { error: jsonError('Sessao autenticada obrigatoria.', 401) };

  const scoped = getSignatureSupabaseUser(token);
  const { data, error } = await scoped.auth.getUser(token);
  if (error || !data.user) return { error: jsonError('Sessao invalida ou expirada.', 401) };

  return { scoped, userId: data.user.id };
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuthenticated(req);
    if ('error' in auth) return auth.error;

    const occurrenceId = new URL(req.url).searchParams.get('occurrenceId');
    if (!occurrenceId) return jsonError('occurrenceId obrigatorio.', 400);

    const { data, error } = await auth.scoped
      .from('document_signature_requests')
      .select('id, school_id, occurrence_id, document_type, recipient_name, recipient_phone, status, signed_storage_path, approved_at, expires_at, created_at')
      .eq('occurrence_id', occurrenceId)
      .order('created_at', { ascending: false });

    if (error) return jsonError(error.message, 400);
    return NextResponse.json({ requests: data || [] });
  } catch (err: any) {
    return jsonError(err.message || 'Erro interno', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuthenticated(req);
    if ('error' in auth) return auth.error;

    const body = await req.json();
    const occurrenceId = String(body.occurrence_id || body.occurrenceId || '');
    const recipientName = String(body.recipient_name || body.recipientName || '').trim();
    const recipientPhone = normalizePhone(String(body.recipient_phone || body.recipientPhone || ''));
    const documentType = String(body.document_type || body.documentType || 'termo');

    if (!occurrenceId || !recipientName || !recipientPhone) {
      return jsonError('occurrence_id, recipient_name e recipient_phone sao obrigatorios.', 400);
    }

    const { data: occurrence, error: occurrenceError } = await auth.scoped
      .from('occurrences')
      .select('*')
      .eq('id', occurrenceId)
      .maybeSingle();

    if (occurrenceError) return jsonError(occurrenceError.message, 400);
    if (!occurrence) return jsonError('Ocorrencia nao encontrada.', 404);

    const studentIds = Array.isArray(occurrence.student_ids) && occurrence.student_ids.length > 0
      ? occurrence.student_ids
      : [occurrence.student_id];
    const ruleCodes = Array.isArray(occurrence.rule_code) ? occurrence.rule_code : [occurrence.rule_code];

    const [{ data: students }, { data: rules }] = await Promise.all([
      auth.scoped.from('students').select('id, name, display_name, class').in('id', studentIds),
      auth.scoped.from('rules').select('code, description, severity, measure').in('code', ruleCodes),
    ]);

    const supabaseAdmin = getSignatureSupabaseAdmin();
    const rawToken = createSignatureToken();
    const tokenHash = hashSignatureToken(rawToken);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();
    const storagePrefix = `${occurrence.school_id}/${occurrenceId}/${tokenHash.slice(0, 16)}`;
    const baseStoragePath = `${storagePrefix}/documento-base.html`;

    const html = renderOccurrenceDocumentHtml({
      schoolName: occurrence.school_id,
      occurrence,
      students: students || [],
      rules: rules || [],
      recipientName,
      documentType,
    });

    const { error: uploadError } = await supabaseAdmin.storage
      .from('signatures')
      .upload(baseStoragePath, Buffer.from(html), {
        contentType: 'text/html; charset=utf-8',
        upsert: true,
      });

    if (uploadError) return jsonError(uploadError.message, 400);

    const { data: request, error: insertError } = await supabaseAdmin
      .from('document_signature_requests')
      .insert({
        school_id: occurrence.school_id,
        occurrence_id: occurrenceId,
        document_type: documentType,
        recipient_name: recipientName,
        recipient_phone: recipientPhone,
        token_hash: tokenHash,
        status: 'pending',
        base_storage_path: baseStoragePath,
        expires_at: expiresAt,
        created_by: auth.userId,
      })
      .select('id, school_id, occurrence_id, document_type, recipient_name, recipient_phone, status, approved_at, expires_at, created_at')
      .single();

    if (insertError) return jsonError(insertError.message, 400);

    const signatureUrl = buildSignatureUrl(siteOrigin(req), rawToken);
    const message = `SIGMILITAR: ${recipientName}, acesse o link unico para visualizar e aprovar/assinar o documento da ocorrencia: ${signatureUrl}`;
    const whatsappUrl = buildWhatsappUrl(recipientPhone, message);

    return NextResponse.json({ request, signatureUrl, whatsappUrl, message });
  } catch (err: any) {
    return jsonError(err.message || 'Erro interno', 500);
  }
}
