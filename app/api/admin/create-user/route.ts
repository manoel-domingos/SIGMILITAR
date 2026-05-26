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
      // Se o erro for "User not found", cria automaticamente as credenciais de autenticação
      if (authError.message === 'User not found' || authError.status === 404) {
        // 1. Busca os dados do perfil na tabela user_profiles
        const { data: profile, error: getProfileError } = await supabaseAdmin
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (getProfileError || !profile) {
          return NextResponse.json({ 
            error: `Usuário não encontrado na autenticação e falha ao buscar perfil: ${getProfileError?.message || 'Perfil não localizado.'}` 
          }, { status: 400 });
        }

        // 2. Cria o usuário no Supabase Auth usando os dados do perfil
        const { data: newAuthData, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: profile.email,
          password,
          email_confirm: true,
          user_metadata: { name: profile.name, role: profile.role },
        });

        if (createError) {
          return NextResponse.json({ 
            error: `Falha ao criar credenciais de autenticação para o usuário: ${createError.message}` 
          }, { status: 400 });
        }

        // 3. Atualiza o ID do perfil com o novo UUID de autenticação gerado pelo Supabase
        const newUuid = newAuthData.user.id;
        const { error: updateProfileError } = await supabaseAdmin
          .from('user_profiles')
          .update({ 
            id: newUuid, 
            password, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', userId);

        if (updateProfileError) {
          console.warn('[PATCH API] Falha ao atualizar UUID do perfil pós-criação:', updateProfileError.message);
        }

        return NextResponse.json({ 
          success: true, 
          created: true,
          user: newAuthData.user 
        });
      }

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
