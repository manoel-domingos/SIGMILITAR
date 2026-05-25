import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Rota server-side: usa service_role para criar usuario no auth.users
export async function POST(req: NextRequest) {
  try {
    const { email, password, name, role, school_id } = await req.json();

    if (!email || !name) {
      return NextResponse.json({ error: 'email e name são obrigatórios.' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Normaliza email: se nao tiver @, adiciona @eecm.local
    const emailNormalized = email.includes('@') ? email : `${email.toLowerCase()}@eecm.local`;

    let userId = '';

    if (password) {
      // 1. Cria no auth.users tradicionalmente
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: emailNormalized,
        password,
        email_confirm: true,
        user_metadata: { name, role },
      });

      if (authError) {
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }
      userId = authData.user.id;
    } else {
      // 2. Envia convite oficial do Supabase por email (fluxo de convites)
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        emailNormalized,
        { data: { name, role } }
      );

      if (inviteError) {
        return NextResponse.json({ error: inviteError.message }, { status: 400 });
      }
      userId = inviteData.user.id;
    }

    // 3. Insere no user_profiles com o UUID do auth
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert([{
        id: userId,
        name,
        email: emailNormalized,
        role,
        school_id: school_id || null,
      }])
      .select()
      .single();

    if (profileError) {
      // Rollback: remove do auth se falhar no perfil
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({ user: profileData });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 });
  }
}

// Rota server-side: usa service_role para redefinir a senha de outro usuário
export async function PATCH(req: NextRequest) {
  try {
    const { userId, password } = await req.json();

    if (!userId || !password) {
      return NextResponse.json({ error: 'userId e password são obrigatórios.' }, { status: 400 });
    }

    if (password.length < 4) {
      return NextResponse.json({ error: 'A senha deve ter pelo menos 4 caracteres.' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Atualiza a senha no Supabase Auth usando a API de Admin
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password }
    );

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Atualiza a senha na tabela user_profiles para compatibilidade histórica
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .update({ password, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (profileError) {
      console.warn('Falha ao sincronizar senha com user_profiles:', profileError.message);
    }

    return NextResponse.json({ success: true, user: authData.user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 });
  }
}
