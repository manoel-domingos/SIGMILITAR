import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

type ProvisionPayload = {
  schoolName?: unknown;
  slug?: unknown;
  dreId?: unknown;
  gestor?: {
    email?: unknown;
    name?: unknown;
  };
  driveFolder?: unknown;
};

type JsonObject = Record<string, unknown>;

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DEFAULT_SCHOOL_SETTINGS = {
  updated_by: 'onboarding/provision',
};

function env(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Variavel de ambiente ausente: ${name}`);
  return value;
}

function adminClient() {
  return createClient(env('NEXT_PUBLIC_SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeSlug(value: unknown) {
  return normalizeText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function jsonError(error: string, status = 400, details?: JsonObject) {
  return NextResponse.json({ ok: false, error, ...(details ? { details } : {}) }, { status });
}

function validatePayload(body: ProvisionPayload) {
  const schoolName = normalizeText(body.schoolName);
  const slug = normalizeSlug(body.slug);
  const dreId = normalizeText(body.dreId);
  const gestorEmail = normalizeText(body.gestor?.email).toLowerCase();
  const gestorName = normalizeText(body.gestor?.name);
  const driveFolder = normalizeText(body.driveFolder);

  const missing = [
    ['schoolName', schoolName],
    ['slug', slug],
    ['dreId', dreId],
    ['gestor.email', gestorEmail],
    ['gestor.name', gestorName],
    ['driveFolder', driveFolder],
  ]
    .filter(([, value]) => !value)
    .map(([field]) => field);

  if (missing.length > 0) {
    return { error: jsonError('Dados obrigatorios ausentes.', 400, { missing }) };
  }

  if (!SLUG_PATTERN.test(slug)) {
    return { error: jsonError('Slug invalido. Use 1 a 63 caracteres: letras minusculas, numeros e hifens; sem hifen nas pontas.', 400) };
  }

  if (!EMAIL_PATTERN.test(gestorEmail)) {
    return { error: jsonError('E-mail do gestor invalido.', 400) };
  }

  return {
    value: {
      schoolName,
      slug,
      dreId,
      gestor: { email: gestorEmail, name: gestorName },
      driveFolder,
    },
  };
}

async function findAuthUserByEmail(supabase: SupabaseClient, email: string) {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`Falha ao listar usuarios Auth: ${error.message}`);

    const found = data.users.find((user) => user.email?.toLowerCase() === email);
    if (found) return found;
    if (data.users.length < 1000) return null;
  }

  throw new Error('Falha ao localizar usuario Auth: limite de paginacao excedido.');
}

async function createOrFindManagerAuthUser(
  supabase: SupabaseClient,
  gestor: { email: string; name: string },
) {
  const existing = await findAuthUserByEmail(supabase, gestor.email);
  if (existing) return existing;

  const { data, error } = await supabase.auth.admin.createUser({
    email: gestor.email,
    password: crypto.randomUUID() + crypto.randomUUID(),
    email_confirm: true,
    user_metadata: { name: gestor.name },
    app_metadata: { role: 'gestor' },
  });

  if (!error && data.user) return data.user;

  if (error?.message.toLowerCase().includes('already')) {
    const user = await findAuthUserByEmail(supabase, gestor.email);
    if (user) return user;
  }

  throw new Error(`Falha ao criar usuario Auth do gestor: ${error?.message || 'usuario nao retornado'}`);
}

async function syncMembership(supabase: SupabaseClient, userId: string, schoolId: string) {
  const payload = {
    user_id: userId,
    school_id: schoolId,
    role_key: 'gestor',
    active: true,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('user_school_memberships').insert(payload);
  if (!error) return;

  if (error.code !== '23505') {
    throw new Error(`Falha ao sincronizar vinculo RBAC: ${error.message}`);
  }

  const { error: updateError } = await supabase
    .from('user_school_memberships')
    .update({ active: true, updated_at: payload.updated_at })
    .eq('user_id', userId)
    .eq('school_id', schoolId)
    .eq('role_key', 'gestor');

  if (updateError) {
    throw new Error(`Falha ao atualizar vinculo RBAC existente: ${updateError.message}`);
  }
}

export async function POST(req: NextRequest) {
  let body: ProvisionPayload;

  try {
    body = await req.json();
  } catch {
    return jsonError('JSON invalido.', 400);
  }

  const parsed = validatePayload(body);
  if ('error' in parsed) return parsed.error;

  const { schoolName, slug, dreId, gestor, driveFolder } = parsed.value;
  const now = new Date().toISOString();

  try {
    const supabase = adminClient();
    const { error: schoolError } = await supabase
      .from('schools')
      .upsert(
        {
          id: slug,
          name: schoolName,
          dre_id: dreId,
          updated_at: now,
        },
        { onConflict: 'id' },
      );

    if (schoolError) throw new Error(`Falha ao salvar escola: ${schoolError.message}`);

    const { error: settingsError } = await supabase
      .from('school_settings')
      .upsert(
        {
          school_id: slug,
          drive_folder_id: driveFolder,
          ...DEFAULT_SCHOOL_SETTINGS,
          updated_at: now,
        },
        { onConflict: 'school_id' },
      );

    if (settingsError) throw new Error(`Falha ao salvar configuracoes da escola: ${settingsError.message}`);

    const authUser = await createOrFindManagerAuthUser(supabase, gestor);

    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert(
        {
          id: authUser.id,
          name: gestor.name,
          email: gestor.email,
          role: 'GESTOR',
          school_id: slug,
          updated_at: now,
        },
        { onConflict: 'id' },
      );

    if (profileError) throw new Error(`Falha ao salvar perfil do gestor: ${profileError.message}`);

    await syncMembership(supabase, authUser.id, slug);

    const { error: auditError } = await supabase.from('audit_logs').insert({
      date: now,
      action: 'CREATE',
      entity_name: 'school',
      entity_id: slug,
      details: `Onboarding provisionado para ${schoolName} (${slug}) via DRE ${dreId}. Gestor: ${gestor.email}. Drive: ${driveFolder}.`,
      user_email: gestor.email,
      school_id: slug,
    });

    if (auditError) throw new Error(`Falha ao registrar auditoria: ${auditError.message}`);

    return NextResponse.json({ ok: true, slug, redirectTo: `/${slug}` });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno no provisionamento.';
    return jsonError(message, 500);
  }
}
