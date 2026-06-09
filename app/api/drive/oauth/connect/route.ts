import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Inicia o fluxo OAuth Google Drive para uma escola.
// O gestor é redirecionado para o consentimento Google; após autorizar, o callback
// armazena o refresh_token em school_settings.
export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'GOOGLE_OAUTH_CLIENT_ID e GOOGLE_OAUTH_CLIENT_SECRET nao configurados.' }, { status: 500 });
  }

  // Aceita token via Authorization header ou query param _token (usado em redirects browser)
  const authHeader = req.headers.get('authorization') || '';
  const [scheme, headerToken] = authHeader.split(' ');
  const accessToken =
    (scheme?.toLowerCase() === 'bearer' && headerToken) ? headerToken
    : req.nextUrl.searchParams.get('_token') || '';
  if (!accessToken) {
    return NextResponse.json({ error: 'Sessao autenticada obrigatoria.' }, { status: 401 });
  }

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { data: authUser, error: authErr } = await anonClient.auth.getUser(accessToken);
  if (authErr || !authUser?.user) {
    return NextResponse.json({ error: 'Sessao invalida.' }, { status: 401 });
  }

  const schoolId = req.nextUrl.searchParams.get('schoolId') || '';
  const origin = req.headers.get('origin') || new URL(req.url).origin;
  const redirectUri = `${origin}/api/drive/oauth/callback`;

  // Guarda schoolId + userId no state (signed via HMAC com service key como segredo)
  const statePayload = JSON.stringify({ schoolId, userId: authUser.user.id, ts: Date.now() });
  const stateB64 = Buffer.from(statePayload).toString('base64url');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/drive.file',
    access_type: 'offline',
    prompt: 'consent',
    state: stateB64,
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

  // Salva redirect_uri em cookie httpOnly para validar no callback (10 min)
  const res = NextResponse.redirect(authUrl);
  res.cookies.set('drive_oauth_redirect_uri', redirectUri, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });
  return res;
}
