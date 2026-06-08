import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { schoolName, slug, dreId, gestor, driveFolder } = body;

  if (!schoolName || !slug || !dreId || !gestor?.email || !gestor?.name) {
    return NextResponse.json({ ok: false, error: 'Dados obrigatórios ausentes' }, { status: 400 });
  }

  const normalizedSlug = String(slug)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/^eecm/, '');

  if (!normalizedSlug) {
    return NextResponse.json({ ok: false, error: 'Slug inválido' }, { status: 400 });
  }

  if (dreId !== 'DRETGA') {
    return NextResponse.json({ ok: false, error: 'DRE inválida para este onboarding' }, { status: 400 });
  }

  const emailNormalized = gestor.email.toLowerCase().trim();

  const authHeader = req.headers.get('authorization') || '';
  const [scheme, accessToken] = authHeader.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !accessToken) {
    return NextResponse.json({ ok: false, error: 'Sessão autenticada obrigatória' }, { status: 401 });
  }

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data: authUser, error: authErr } = await anonClient.auth.getUser(accessToken);
  if (authErr || !authUser?.user?.email) {
    return NextResponse.json({ ok: false, error: 'Sessão inválida ou expirada' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  // admin_global pode provisionar escolas declarando QUALQUER e-mail de gestor.
  // Demais usuários (onboarding self-service) só podem declarar o próprio e-mail.
  const { data: requesterProfile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', authUser.user.id)
    .maybeSingle();
  const isAdminGlobal = String(requesterProfile?.role || '').toLowerCase() === 'admin_global';

  if (!isAdminGlobal && authUser.user.email.toLowerCase().trim() !== emailNormalized) {
    return NextResponse.json({ ok: false, error: 'O gestor declarado deve ser o usuário autenticado' }, { status: 403 });
  }

  const { data: existing } = await supabase
    .from('schools')
    .select('id')
    .eq('id', normalizedSlug)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ok: false, error: `Escola já existe com slug "${normalizedSlug}"` }, { status: 409 });
  }

  const { error: schoolError } = await supabase
    .from('schools')
    .insert({ id: normalizedSlug, name: schoolName, dre_id: dreId, active: true });

  if (schoolError) {
    return NextResponse.json({ ok: false, error: `Falha ao criar escola: ${schoolError.message}` }, { status: 400 });
  }

  const { error: rulesError } = await supabase.rpc('backfill_default_rules_for_school', {
    target_school_id: normalizedSlug,
  });

  if (rulesError) {
    await supabase.from('rules').delete().eq('school_id', normalizedSlug);
    await supabase.from('schools').delete().eq('id', normalizedSlug);
    return NextResponse.json({ ok: false, error: `Falha ao copiar regras padrão: ${rulesError.message}` }, { status: 400 });
  }

  const driveFolderId = typeof driveFolder === 'string' ? driveFolder.trim() : driveFolder?.id;

  if (driveFolderId) {
    await supabase
      .from('school_settings')
      .upsert({ school_id: normalizedSlug, drive_folder_id: driveFolderId }, { onConflict: 'school_id' });
  }

  // Quando o próprio gestor se cadastra, vinculamos já o UUID de auth dele.
  // Quando o admin cria para outro e-mail, deixamos o id default (gen_random_uuid)
  // — o gestor vincula seu UUID real no primeiro login (whitelist em store.tsx).
  const selfRegister = authUser.user.email!.toLowerCase().trim() === emailNormalized;
  const profilePayload: Record<string, any> = {
    email: emailNormalized,
    name: gestor.name,
    role: 'GESTOR',
    school_id: normalizedSlug,
  };
  if (selfRegister) profilePayload.id = authUser.user.id;

  const { error: profileError } = await supabase
    .from('user_profiles')
    .upsert(profilePayload, { onConflict: 'email' });

  if (profileError) {
    await supabase.from('rules').delete().eq('school_id', normalizedSlug);
    await supabase.from('school_settings').delete().eq('school_id', normalizedSlug);
    await supabase.from('schools').delete().eq('id', normalizedSlug);
    return NextResponse.json({ ok: false, error: `Falha ao criar perfil: ${profileError.message}` }, { status: 400 });
  }

  const { error: whitelistError } = await supabase
    .from('tenant_email_whitelist')
    .upsert(
      {
        tenant: normalizedSlug,
        school_id: normalizedSlug,
        email: emailNormalized,
        role: 'gestor',
        active: true,
      },
      { onConflict: 'tenant,email' },
    );

  if (whitelistError) {
    await supabase.from('user_profiles').delete().eq('email', emailNormalized).eq('school_id', normalizedSlug);
    await supabase.from('schools').delete().eq('id', normalizedSlug);
    return NextResponse.json({ ok: false, error: `Falha ao liberar e-mail do gestor: ${whitelistError.message}` }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    slug: normalizedSlug,
    school: { id: normalizedSlug, name: schoolName, dre_id: dreId },
    gestor: { email: emailNormalized, login_url: 'https://sigmilitar.com.br/login' },
  });
}
