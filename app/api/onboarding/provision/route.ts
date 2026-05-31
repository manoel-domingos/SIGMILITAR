import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { schoolName, slug, dreId, gestor, driveFolder } = body;

  if (!schoolName || !slug || !dreId || !gestor?.email) {
    return NextResponse.json({ ok: false, error: 'Dados obrigatórios ausentes' }, { status: 400 });
  }

  // STUB: registrar escola no banco master (projeto central Supabase)
  // TODO: chamar provisionSchool() quando VPS estiver pronta
  // Por enquanto apenas persiste no banco central e cria o user como GESTOR

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Criar usuário (se email/senha — Google já criou via OAuth)
  // 2. Upsert perfil com role GESTOR + school_id
  // 3. Inserir escola na tabela schools

  // TODO: implementar quando schema estiver definido (tabela schools)
  await new Promise((r) => setTimeout(r, 500)); // simula latência

  // Simulação de sucesso
  console.log('[ONBOARDING STUB] Escola registrada:', { schoolName, slug, dreId, gestor, driveFolder });

  return NextResponse.json({
    ok: true,
    slug,
    message: 'Escola registrada (stub)',
  });
}
