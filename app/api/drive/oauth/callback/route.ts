import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Mesma resolução do connect: garante que a redirect_uri usada na troca do code
// seja idêntica à enviada no consentimento (evita redirect_uri_mismatch / invalid_grant).
function resolveRedirectUri(req: NextRequest): string {
  const explicit = process.env.GOOGLE_OAUTH_REDIRECT_URI;
  if (explicit) return explicit.trim();
  const proto = (req.headers.get('x-forwarded-proto') || 'https').split(',')[0].trim();
  const host = (req.headers.get('x-forwarded-host') || req.headers.get('host') || new URL(req.url).host)
    .split(',')[0].trim();
  return `${proto}://${host}/api/drive/oauth/callback`;
}

// Callback do OAuth Google Drive. O Google redireciona aqui após o consentimento.
// Troca o `code` por refresh_token e armazena em school_settings.
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get('code');
  const stateB64 = searchParams.get('state');
  const error = searchParams.get('error');

  const origin = new URL(req.url).origin;
  const failRedirect = (msg: string) =>
    NextResponse.redirect(`${origin}/dretga/configuracoes?drive=error&msg=${encodeURIComponent(msg)}`);

  if (error) return failRedirect(`Google negou acesso: ${error}`);
  if (!code || !stateB64) return failRedirect('Parametros ausentes no callback.');

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) return failRedirect('Credenciais OAuth nao configuradas no servidor.');

  // Decodifica state
  let schoolId = '';
  let returnTo = '/dretga/configuracoes';
  try {
    const decoded = JSON.parse(Buffer.from(stateB64, 'base64url').toString('utf-8'));
    schoolId = String(decoded.schoolId || '');
    const rawReturnTo = String(decoded.returnTo || '');
    if (/^\/[A-Za-z0-9/_\-?=&.]*$/.test(rawReturnTo)) returnTo = rawReturnTo;
    const ts = Number(decoded.ts || 0);
    if (Date.now() - ts > 15 * 60 * 1000) return failRedirect('Link de autorizacao expirado. Tente novamente.');
  } catch {
    return failRedirect('State invalido.');
  }

  // Recupera redirect_uri do cookie (idêntica à do connect); fallback resolve do mesmo jeito
  const redirectUri = req.cookies.get('drive_oauth_redirect_uri')?.value || resolveRedirectUri(req);

  // Troca code por tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.refresh_token) {
    return failRedirect(tokenData.error_description || 'Falha ao obter refresh_token. Certifique-se de usar access_type=offline e prompt=consent.');
  }

  // Obtém e-mail do gestor via userinfo
  let gestorEmail = '';
  try {
    const infoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const info = await infoRes.json();
    gestorEmail = info.email || '';
  } catch { /* não crítico */ }

  // Persiste no Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { error: upsertErr } = await supabase
    .from('school_settings')
    .upsert(
      {
        school_id: schoolId || 'dretga',
        google_oauth_refresh_token: tokenData.refresh_token,
        google_oauth_email: gestorEmail,
        google_oauth_connected_at: new Date().toISOString(),
      },
      { onConflict: 'school_id' },
    );

  if (upsertErr) return failRedirect(`Erro ao salvar token: ${upsertErr.message}`);

  const sep = returnTo.includes('?') ? '&' : '?';
  const res = NextResponse.redirect(`${origin}${returnTo}${sep}drive=connected&email=${encodeURIComponent(gestorEmail)}`);
  // Limpa o cookie
  res.cookies.delete('drive_oauth_redirect_uri');
  return res;
}
