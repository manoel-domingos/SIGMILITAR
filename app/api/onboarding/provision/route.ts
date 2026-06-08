import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { schoolName, slug, dreId, gestor, driveFolder } = body;

  if (!schoolName || !slug || !dreId || !gestor?.email || !gestor?.name) {
    return NextResponse.json({ ok: false, error: 'Dados obrigatórios ausentes' }, { status: 400 });
  }

  const normalizedSlug = String(slug).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!normalizedSlug) {
    return NextResponse.json({ ok: false, error: 'Slug inválido' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

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

  if (driveFolder?.id) {
    await supabase
      .from('school_settings')
      .update({ drive_folder_id: driveFolder.id })
      .eq('school_id', normalizedSlug);
  }

  const emailNormalized = gestor.email.toLowerCase().trim();

  const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
    emailNormalized,
    { data: { name: gestor.name, school_id: normalizedSlug, role: 'GESTOR' } },
  );

  if (inviteError) {
    await supabase.from('schools').delete().eq('id', normalizedSlug);
    return NextResponse.json({ ok: false, error: `Falha ao convidar gestor: ${inviteError.message}` }, { status: 400 });
  }

  const userId = inviteData.user.id;

  const { error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      id: userId,
      email: emailNormalized,
      name: gestor.name,
      role: 'GESTOR',
      school_id: normalizedSlug,
    });

  if (profileError && profileError.code !== '23505') {
    await supabase.auth.admin.deleteUser(userId);
    await supabase.from('schools').delete().eq('id', normalizedSlug);
    return NextResponse.json({ ok: false, error: `Falha ao criar perfil: ${profileError.message}` }, { status: 400 });
  }

  await supabase
    .from('user_school_memberships')
    .insert({
      user_id: userId,
      school_id: normalizedSlug,
      role_key: 'gestor',
      active: true,
    });

  return NextResponse.json({
    ok: true,
    slug: normalizedSlug,
    school: { id: normalizedSlug, name: schoolName, dre_id: dreId },
    gestor: { id: userId, email: emailNormalized },
  });
}
