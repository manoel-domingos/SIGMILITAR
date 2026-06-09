import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateFullBackup } from '@/lib/backup';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const [scheme, accessToken] = authHeader.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !accessToken) {
      return NextResponse.json({ ok: false, error: 'Sessão autenticada obrigatória' }, { status: 401 });
    }

    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: authUser, error: authErr } = await anonClient.auth.getUser(accessToken);
    if (authErr || !authUser?.user?.email) {
      return NextResponse.json({ ok: false, error: 'Sessão inválida ou expirada' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const email = authUser.user.email.toLowerCase().trim();
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('email', email)
      .maybeSingle();

    const isAdmin = profile?.role === 'admin_global' || email === 'manoeldomingos2@gmail.com' || email === 'manoeldomingos@gmail.com';
    if (!isAdmin) {
      return NextResponse.json({ ok: false, error: 'Permissão negada. Apenas Administradores Globais.' }, { status: 403 });
    }

    // Gerar backup completo
    console.log('[BACKUP MANUAL] Gerando backup completo do banco...');
    const backupData = await generateFullBackup();
    const jsonString = JSON.stringify(backupData, null, 2);
    const fileName = `full_backup_${Date.now()}.json`;
    const buffer = Buffer.from(jsonString, 'utf-8');

    // Enviar para Supabase Storage
    console.log('[BACKUP MANUAL] Salvando no Supabase Storage...');
    const { error: uploadErr } = await supabase.storage
      .from('student-files')
      .upload(`backups/${fileName}`, buffer, {
        contentType: 'application/json',
        cacheControl: '3600',
        upsert: true
      });

    if (uploadErr) {
      console.error('[BACKUP MANUAL] Falha no upload p/ storage:', uploadErr.message);
    }

    return NextResponse.json({
      ok: true,
      fileName,
      backup: backupData
    });

  } catch (err: any) {
    console.error('[BACKUP MANUAL] Erro:', err.message);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
