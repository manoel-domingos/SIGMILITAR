import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateFullBackup } from '@/lib/backup';
import { createFile } from '@/lib/google-drive';

export async function GET(req: NextRequest) {
  try {
    // Validação de segurança opcional via CRON_SECRET (Vercel)
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    console.log('[CRON BACKUP] Iniciando rotina diária de backup...');
    const backupData = await generateFullBackup();
    const jsonString = JSON.stringify(backupData, null, 2);
    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `full_backup_cron_${timestampStr}.json`;
    const buffer = Buffer.from(jsonString, 'utf-8');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1. Enviar para o Supabase Storage como garantia
    console.log('[CRON BACKUP] Enviando cópia para Supabase Storage...');
    const { error: uploadErr } = await supabase.storage
      .from('student-files')
      .upload(`backups/${fileName}`, buffer, {
        contentType: 'application/json',
        cacheControl: '3600',
        upsert: true
      });
    if (uploadErr) {
      console.error('[CRON BACKUP] Erro no upload p/ storage:', uploadErr.message);
    }

    // 2. Buscar pasta mapeada do Admin (DRE)
    console.log('[CRON BACKUP] Buscando pasta do Drive do Admin...');
    const { data: dreSettings } = await supabase
      .from('school_settings')
      .select('drive_folder_id')
      .eq('school_id', 'DRE')
      .maybeSingle();

    const folderId = dreSettings?.drive_folder_id || '1_aj5b9ukcApeUzSs2dFgIdgHclW4uYbk';
    console.log('[CRON BACKUP] ID da pasta destino no Google Drive:', folderId);

    // 3. Criar arquivo no Google Drive do Admin
    console.log('[CRON BACKUP] Criando arquivo no Google Drive...');
    const driveFile = await createFile(folderId, fileName, 'application/json', jsonString, 'DRE');

    console.log('[CRON BACKUP] Backup rotineiro concluído com sucesso!');
    return NextResponse.json({
      ok: true,
      fileName,
      googleDriveFileId: driveFile?.id || null
    });

  } catch (err: any) {
    console.error('[CRON BACKUP] Falha crítica:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
