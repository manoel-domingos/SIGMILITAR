import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getPublicSchoolName(name: string): string {
  const clean = name.trim().replace(/\s+/g, ' ');
  if (/^e\.?e\.?c\.?m\.?\s+/i.test(clean)) return clean.replace(/^e\.?e\.?c\.?m\.?/i, 'EECM');
  return `EECM ${clean}`;
}

function normalizeSlug(input: string, schoolName: string): string {
  const source = input || getPublicSchoolName(schoolName);
  const normalized = source
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

  return normalized.startsWith('eecm') ? normalized : `eecm${normalized}`;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { schoolName, slug, dreId, gestor, driveFolder, logoUrl } = body;

  if (!schoolName || !slug || !dreId || !gestor?.email) {
    return NextResponse.json({ ok: false, error: 'Dados obrigatórios ausentes' }, { status: 400 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return NextResponse.json({ ok: false, error: 'Service role do Supabase não configurada.' }, { status: 500 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey
  );

  const tenantSlug = normalizeSlug(slug, schoolName);
  const publicName = getPublicSchoolName(schoolName);
  const driveFolderId = typeof driveFolder === 'string' && driveFolder.trim() ? driveFolder.trim() : null;
  const logo = typeof logoUrl === 'string' && logoUrl.trim() ? logoUrl.trim() : null;

  const { error: schoolError } = await supabase
    .from('schools')
    .upsert({
      id: tenantSlug,
      name: publicName,
      dre_id: dreId,
      active: true,
      metadata: {
        slug: tenantSlug,
        url_path: `/${tenantSlug}`,
        onboarding: true,
        gestor_email: gestor.email,
        gestor_name: gestor.name || null,
      },
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

  if (schoolError) {
    return NextResponse.json({ ok: false, error: schoolError.message }, { status: 500 });
  }

  const { error: settingsError } = await supabase
    .from('school_settings')
    .upsert({
      school_id: tenantSlug,
      drive_folder_id: driveFolderId,
      default_panel_module: 'civico-militar',
      grades: ['1º Ano', '2º Ano', '3º Ano'],
      class_letters: ['A', 'B', 'C'],
      special_years: [],
      standalone_classes: [],
      logo_config: logo ? { uploaded: logo, sidebar: logo, dashboard: logo, login: logo } : {},
      theme_config: {},
      updated_by: gestor.email,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'school_id' });

  if (settingsError) {
    return NextResponse.json({ ok: false, error: settingsError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    slug: tenantSlug,
    url: `/${tenantSlug}`,
    message: driveFolderId
      ? 'Escola registrada com Google Drive configurado.'
      : 'Escola registrada sem Google Drive. Configure depois para usar painéis de arquivos.',
  });
}
