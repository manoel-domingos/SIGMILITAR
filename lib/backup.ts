import { createClient } from '@supabase/supabase-js';

export async function generateFullBackup(): Promise<Record<string, any>> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const backupData: Record<string, any> = {
    timestamp: new Date().toISOString(),
    version: '1.0'
  };

  const tables = [
    'schools',
    'school_settings',
    'user_profiles',
    'tenant_email_whitelist',
    'students',
    'occurrences',
    'accidents',
    'praises',
    'rules',
    'summons',
    'conduct_terms',
    'audit_logs',
    'staff_members'
  ];

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*');
      if (error) {
        console.error(`[BACKUP] Erro ao buscar tabela ${table}:`, error.message);
        backupData[table] = [];
      } else {
        backupData[table] = data || [];
      }
    } catch (err: any) {
      console.error(`[BACKUP] Falha crítica na tabela ${table}:`, err.message);
      backupData[table] = [];
    }
  }

  return backupData;
}
