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

  const driveFolderId = typeof driveFolder === 'string' ? driveFolder.trim() : driveFolder?.id;

  if (driveFolderId) {
    await supabase
      .from('school_settings')
      .update({ drive_folder_id: driveFolderId })
      .eq('school_id', normalizedSlug);
  }

  const emailNormalized = gestor.email.toLowerCase().trim();

  const { error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      email: emailNormalized,
      name: gestor.name,
      role: 'GESTOR',
      school_id: normalizedSlug,
    });

  if (profileError && profileError.code !== '23505') {
    await supabase.from('schools').delete().eq('id', normalizedSlug);
    return NextResponse.json({ ok: false, error: `Falha ao criar perfil: ${profileError.message}` }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    slug: normalizedSlug,
    school: { id: normalizedSlug, name: schoolName, dre_id: dreId },
    gestor: { email: emailNormalized, login_url: 'https://sigmilitar.com.br/login' },
  });
}
