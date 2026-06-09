const { Client } = require('pg');
const fs = require('fs');

function loadEnv() {
  const content = fs.readFileSync('.env.local', 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.substring(0, idx).trim();
    let val = trimmed.substring(idx + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.substring(1, val.length - 1);
    }
    process.env[key] = val;
  }
}

async function main() {
  loadEnv();

  const client = new Client({
    host: 'bd.sigmilitar.com.br',
    port: 5432,
    user: 'postgres',
    password: process.env.SERVICE_PASSWORD_POSTGRES || '0U833Rm5lpgOssHjVaVna3k0TRBK6FcF',
    database: 'postgres',
    ssl: false // self-hosted might not require ssl, or might fail if forced. Let's try false first.
  });

  try {
    console.log("Connecting to PostgreSQL...");
    await client.connect();
    console.log("Connected successfully!");

    const sql = `
CREATE TABLE IF NOT EXISTS agenda_preventiva (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  tematica TEXT,
  eixo TEXT,
  data_inicio DATE,
  data_fim DATE,
  periodicidade TEXT,
  publico_alvo TEXT,
  status TEXT DEFAULT 'planejado',
  occurrence_id TEXT,
  student_id TEXT,
  source TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE agenda_preventiva ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura de agenda_preventiva por escola" ON agenda_preventiva;
CREATE POLICY "Leitura de agenda_preventiva por escola" ON agenda_preventiva
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() ->> 'role' = 'admin_global') OR
    (school_id = COALESCE(auth.jwt() ->> 'school_id', ''))
  );

DROP POLICY IF EXISTS "Escrita de agenda_preventiva por gestores ou admin_global" ON agenda_preventiva;
CREATE POLICY "Escrita de agenda_preventiva por gestores ou admin_global" ON agenda_preventiva
  FOR ALL TO authenticated
  USING (
    (auth.jwt() ->> 'role' = 'admin_global') OR
    (school_id = COALESCE(auth.jwt() ->> 'school_id', '') AND auth.jwt() ->> 'role' IN ('admin_global', 'GESTOR', 'COORD'))
  )
  WITH CHECK (
    (auth.jwt() ->> 'role' = 'admin_global') OR
    (school_id = COALESCE(auth.jwt() ->> 'school_id', '') AND auth.jwt() ->> 'role' IN ('admin_global', 'GESTOR', 'COORD'))
  );

CREATE INDEX IF NOT EXISTS idx_agenda_preventiva_school_occurrence_source
  ON agenda_preventiva (school_id, occurrence_id, source)
  WHERE occurrence_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_agenda_preventiva_school_student
  ON agenda_preventiva (school_id, student_id)
  WHERE student_id IS NOT NULL;
    `;

    console.log("Running migration SQL...");
    await client.query(sql);
    console.log("Migration executed successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
  }
}

main();
