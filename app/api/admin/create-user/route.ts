import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { promises as dns } from 'dns';

type AppRole = 'admin_global' | 'GESTOR' | 'COORD' | 'PROFESSOR' | 'MONITOR';

type Profile = {
  id: string;
  email: string;
  name: string;
  role: AppRole | string;
  school_id: string | null;
};

const ROLE_TO_RBAC: Record<string, string> = {
  admin_global: 'admin_global',
  admin: 'admin_global',
  gestor: 'gestor',
  coord: 'coord',
  coordenador: 'coord',
  professor: 'professor',
  monitor: 'monitor',
};

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

function normalizeRole(role: string): AppRole {
  const normalized = ROLE_TO_RBAC[role.toLowerCase()] || 'monitor';
  if (normalized === 'gestor') return 'GESTOR';
  if (normalized === 'coord') return 'COORD';
  if (normalized === 'professor') return 'PROFESSOR';
  if (normalized === 'monitor') return 'MONITOR';
  return 'admin_global';
}

function rbacRole(role: string) {
  return ROLE_TO_RBAC[role.toLowerCase()] || 'monitor';
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

// Domínios gov.br conhecidos por rejeitar emails de servidores SMTP compartilhados
const KNOWN_BOUNCE_DOMAINS = new Set([
  'edu.mt.gov.br',
  'educacao.go.gov.br',
  'seed.pr.gov.br',
  'educacao.ba.gov.br',
  'educacao.sp.gov.br',
  'see.mg.gov.br',
  'seduc.ce.gov.br',
  'seduc.pa.gov.br',
]);

async function validateEmailDeliverability(email: string): Promise<{ valid: boolean; reason?: string }> {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return { valid: false, reason: 'Formato de email inválido.' };

  if (KNOWN_BOUNCE_DOMAINS.has(domain)) {
    return {
      valid: false,
      reason: `O domínio "${domain}" bloqueia emails automáticos. Cadastre o usuário com senha manual ou use outro email.`,
    };
  }

  try {
    const mxRecords = await dns.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      return { valid: false, reason: `O domínio "${domain}" não possui servidor de email (MX) configurado.` };
    }
  } catch {
    return { valid: false, reason: `Não foi possível verificar o domínio "${domain}". Verifique se o email está correto.` };
  }

  return { valid: true };
}

async function requireUserManager(req: NextRequest, targetSchoolId: string | null) {
  const token = bearerToken(req);
  if (!token) return { error: jsonError('Sessao autenticada obrigatoria.', 401) };

  const scoped = userClient(token);
  const { data: userData, error: userError } = await scoped.auth.getUser(token);

  if (userError || !userData.user) {
    return { error: jsonError('Sessao invalida ou expirada.', 401) };
  }

  const { data: isAdminGlobal } = await scoped.rpc('current_user_is_admin_global');
  if (isAdminGlobal === true) {
    return { scoped, callerId: userData.user.id, isAdminGlobal: true };
  }

  if (!targetSchoolId || targetSchoolId === 'DRE') {
    return { error: jsonError('Apenas admin global pode gerenciar usuario global.', 403) };
  }

  const { data: canManage, error: permissionError } = await scoped.rpc('user_has_permission', {
    target_school_id: targetSchoolId,
    permission: 'users.manage',
  });

  if (!permissionError && canManage === true) {
    return { scoped, callerId: userData.user.id, isAdminGlobal: false };
  }

  // Temporary compatibility for environments where RBAC migration is not applied yet.
  const { data: profile } = await scoped
    .from('user_profiles')
    .select('role, school_id')
    .eq('id', userData.user.id)
    .maybeSingle();

  const callerRole = String(profile?.role || '').toLowerCase();
  const sameSchool = profile?.school_id === targetSchoolId;
  const legacyAllowed = sameSchool && (callerRole.includes('gestor') || callerRole.includes('admin'));

  if (!legacyAllowed) {
    return { error: jsonError('Usuario sem permissao para gerenciar contas desta escola.', 403) };
  }

  return { scoped, callerId: userData.user.id, isAdminGlobal: false };
}

async function syncMembership(
  supabaseAdmin: SupabaseClient,
  userId: string,
  role: AppRole,
  schoolId: string | null,
) {
  const roleKey = rbacRole(role);
  const membershipSchoolId = roleKey === 'admin_global' ? null : schoolId;

  const { error } = await supabaseAdmin
    .from('user_school_memberships')
    .insert({
      user_id: userId,
      school_id: membershipSchoolId,
      role_key: roleKey,
      active: true,
      updated_at: new Date().toISOString(),
    });

  if (error && error.code !== '42P01' && error.code !== '23505') {
    throw new Error(`Falha ao sincronizar RBAC: ${error.message}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, name, role, school_id, cargo } = await req.json();

    if (!email || !name) {
      return jsonError('email e name sao obrigatorios.', 400);
    }

    const emailNormalized = email.toLowerCase().trim();

    if (!emailNormalized.endsWith('@edu.mt.gov.br')) {
      return jsonError('Apenas e-mails @edu.mt.gov.br são permitidos neste sistema.', 400);
    }

    const normalizedRole = normalizeRole(String(role || 'MONITOR'));
    const profileSchoolId = normalizedRole === 'admin_global' ? 'DRE' : String(school_id || '');
    const authz = await requireUserManager(req, normalizedRole === 'admin_global' ? null : profileSchoolId);

    if ('error' in authz) return authz.error;
    if (normalizedRole === 'admin_global' && !authz.isAdminGlobal) {
      return jsonError('Apenas admin global pode criar outro admin global.', 403);
    }
    if (normalizedRole !== 'admin_global' && !profileSchoolId) {
      return jsonError('school_id e obrigatorio para usuarios de escola.', 400);
    }

    const supabaseAdmin = adminClient();

    // Verifica se já existe perfil com este email
    const { data: existing } = await supabaseAdmin
      .from('user_profiles')
      .select('id, email')
      .eq('email', emailNormalized)
      .maybeSingle();

    if (existing) {
      return jsonError('Este e-mail já está cadastrado no sistema.', 409);
    }

    // Cria apenas o perfil (whitelist). O UUID será vinculado automaticamente
    // quando o usuário fizer login com Google pela primeira vez.
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert([{
        name,
        email: emailNormalized,
        role: normalizedRole,
        school_id: profileSchoolId,
        cargo: cargo || null,
      }])
      .select()
      .single();

    if (profileError) {
      return jsonError(profileError.message, 400);
    }

    return NextResponse.json({ user: profileData });
  } catch (err: any) {
    return jsonError(err.message || 'Erro interno', 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId, password } = await req.json();

    if (!userId || !password) {
      return jsonError('userId e password sao obrigatorios.', 400);
    }

    if (password.length < 8) {
      return jsonError('A senha deve ter pelo menos 8 caracteres.', 400);
    }

    const supabaseAdmin = adminClient();
    const { data: targetProfile, error: targetError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, email, name, role, school_id')
      .eq('id', userId)
      .single<Profile>();

    if (targetError || !targetProfile) {
      return jsonError(targetError?.message || 'Perfil nao localizado.', 404);
    }

    const authz = await requireUserManager(req, targetProfile.school_id);
    if ('error' in authz) return authz.error;

    const targetRole = normalizeRole(String(targetProfile.role || 'MONITOR'));
    if (targetRole === 'admin_global' && !authz.isAdminGlobal) {
      return jsonError('Apenas admin global pode redefinir senha de admin global.', 403);
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password },
    );

    if (authError) {
      if (authError.message === 'User not found' || authError.status === 404) {
        const { data: newAuthData, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: targetProfile.email,
          password,
          email_confirm: true,
          user_metadata: { name: targetProfile.name },
          app_metadata: { role: rbacRole(String(targetProfile.role)) },
        });

        if (createError) {
          return jsonError(`Falha ao criar credenciais de autenticacao: ${createError.message}`, 400);
        }

        const { error: updateProfileError } = await supabaseAdmin
          .from('user_profiles')
          .update({
            id: newAuthData.user.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (updateProfileError) return jsonError(updateProfileError.message, 400);

        await syncMembership(supabaseAdmin, newAuthData.user.id, targetRole, targetProfile.school_id);

        return NextResponse.json({
          success: true,
          created: true,
          user: newAuthData.user,
        });
      }

      return jsonError(authError.message, 400);
    }

    await supabaseAdmin
      .from('user_profiles')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', userId);

    return NextResponse.json({ success: true, user: authData.user });
  } catch (err: any) {
    return jsonError(err.message || 'Erro interno', 500);
  }
}
