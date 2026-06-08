import { createHash, randomBytes } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

function supabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL!;
}

function anonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
}

function serviceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY!;
}

function adminClient() {
  return createClient(supabaseUrl(), serviceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function userClient(accessToken: string) {
  return createClient(supabaseUrl(), anonKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

function bearerToken(req: NextRequest) {
  const header = req.headers.get('authorization') || '';
  const [type, token] = header.split(' ');
  return type?.toLowerCase() === 'bearer' && token ? token : null;
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

async function canManageOccurrence(req: NextRequest, schoolId: string) {
  const token = bearerToken(req);
  if (!token) return { ok: false, response: jsonError('Sessao autenticada obrigatoria.', 401) };

  const scoped = userClient(token);
  const { data: authUser, error: authError } = await scoped.auth.getUser(token);
  if (authError || !authUser.user) return { ok: false, response: jsonError('Sessao invalida ou expirada.', 401) };

  const permissions = ['occurrences.update', 'occurrences.create'];
  for (const permission of permissions) {
    const { data, error } = await scoped.rpc('user_has_permission', {
      target_school_id: schoolId,
      permission,
    });
    if (!error && data === true) return { ok: true, userId: authUser.user.id };
  }

  const { data: profile } = await scoped
    .from('user_profiles')
    .select('role, school_id')
    .eq('id', authUser.user.id)
    .maybeSingle();

  const role = String(profile?.role || '').toLowerCase();
  const sameSchool = profile?.school_id === schoolId;
  const legacyAllowed = sameSchool && ['gestor', 'coord', 'admin'].some((allowed) => role.includes(allowed));
  if (!legacyAllowed) return { ok: false, response: jsonError('Usuario sem permissao para gerar QR Code desta escola.', 403) };

  return { ok: true, userId: authUser.user.id };
}

export async function POST(req: NextRequest) {
  try {
    if (!supabaseUrl() || !anonKey() || !serviceRoleKey()) {
      return jsonError('Supabase nao configurado.', 500);
    }

    const body = await req.json();
    const schoolId = String(body.school_id || '').trim();
    const occurrenceId = String(body.occurrence_id || '').trim();
    const studentId = String(body.student_id || '').trim();
    const expiresInHours = Math.min(Math.max(Number(body.expires_in_hours || 72), 1), 168);

    if (!schoolId || !occurrenceId || !studentId) {
      return jsonError('school_id, occurrence_id e student_id sao obrigatorios.', 400);
    }

    const authz = await canManageOccurrence(req, schoolId);
    if (!authz.ok) return authz.response;

    const supabaseAdmin = adminClient();
    const { data: occurrence, error: occurrenceError } = await supabaseAdmin
      .from('occurrences')
      .select('id, school_id, student_id')
      .eq('id', occurrenceId)
      .eq('school_id', schoolId)
      .maybeSingle();

    if (occurrenceError) return jsonError(occurrenceError.message, 400);
    if (!occurrence) return jsonError('Ocorrencia nao encontrada neste tenant.', 404);
    if (String(occurrence.student_id) !== studentId) return jsonError('Aluno nao pertence a ocorrencia informada.', 400);

    const token = randomBytes(32).toString('base64url');
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString();

    const { data: upload, error: insertError } = await supabaseAdmin
      .from('signed_document_uploads')
      .insert({
        school_id: schoolId,
        occurrence_id: occurrenceId,
        student_id: studentId,
        token_hash: tokenHash,
        expires_at: expiresAt,
        created_by: authz.userId,
      })
      .select('id, expires_at')
      .single();

    if (insertError) return jsonError(insertError.message, 400);

    const origin = req.headers.get('origin') || new URL(req.url).origin;
    const url = `${origin}/upload-assinado/${token}`;

    return NextResponse.json({
      upload_id: upload.id,
      token,
      url,
      expires_at: upload.expires_at,
      status: 'pendente',
    });
  } catch (error: any) {
    return jsonError(error.message || 'Erro ao gerar link.', 500);
  }
}
