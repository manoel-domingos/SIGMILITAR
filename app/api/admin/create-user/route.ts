import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Rota server-side: usa service_role para criar usuario no auth.users
export async function POST(req: NextRequest) {
  try {
    const { email, password, name, role, school_id } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'email, password e name são obrigatórios.' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Normaliza email: se nao tiver @, adiciona @eecm.local
    const emailNormalized = email.includes('@') ? email : `${email.toLowerCase()}@eecm.local`;

    // 1. Cria no auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: emailNormalized,
      password,
      email_confirm: true,
      user_metadata: { name, role },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // 2. Insere no user_profiles com o UUID do auth
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert([{
        id: authData.user.id,
        name,
        email: emailNormalized,
        role,
        school_id: school_id || null,
      }])
      .select()
      .single();

    if (profileError) {
      // Rollback: remove do auth se falhar no perfil
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({ user: profileData });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 });
  }
}
