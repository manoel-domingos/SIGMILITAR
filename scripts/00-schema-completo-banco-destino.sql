-- ========================================
-- SCRIPT COMPLETO: Schema do Banco Destino
-- ========================================
-- Execute este SQL no SQL Editor do Supabase (banco destino)
-- URL: https://supabase.com/dashboard/project/lylgssfgcrbirfdshhpz/sql

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- TABELA: schools (escolas)
-- ========================================
CREATE TABLE IF NOT EXISTS schools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir escola padrao DRE
INSERT INTO schools (id, name) VALUES ('DRE', 'Diretoria Regional de Ensino')
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- TABELA: user_profiles (perfis de usuario)
-- ========================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'MONITOR',
  school_id TEXT REFERENCES schools(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- TABELA: app_users (usuarios legado - manter compatibilidade)
-- ========================================
CREATE TABLE IF NOT EXISTS app_users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'MONITOR',
  school_id TEXT REFERENCES schools(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- TABELA: students (alunos)
-- ========================================
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  class TEXT NOT NULL,
  shift TEXT NOT NULL,
  points NUMERIC NOT NULL DEFAULT 10.0,
  contacts JSONB,
  observation TEXT,
  address TEXT,
  cpf TEXT,
  "registrationNumber" TEXT,
  "birthDate" TEXT,
  archived BOOLEAN DEFAULT FALSE,
  school_id TEXT REFERENCES schools(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- TABELA: rules (regras disciplinares)
-- ========================================
CREATE TABLE IF NOT EXISTS rules (
  code INTEGER PRIMARY KEY,
  description TEXT NOT NULL,
  severity TEXT NOT NULL,
  points NUMERIC NOT NULL,
  measure TEXT NOT NULL,
  school_id TEXT REFERENCES schools(id)
);

-- ========================================
-- TABELA: occurrences (ocorrencias)
-- ========================================
CREATE TABLE IF NOT EXISTS occurrences (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  rule_code INTEGER REFERENCES rules(code),
  registered_by TEXT,
  observations TEXT,
  archived BOOLEAN DEFAULT FALSE,
  school_id TEXT REFERENCES schools(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- TABELA: accidents (acidentes)
-- ========================================
CREATE TABLE IF NOT EXISTS accidents (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  location TEXT,
  type TEXT,
  description TEXT,
  body_part TEXT,
  registered_by TEXT,
  parents_notified BOOLEAN,
  medic_forwarded BOOLEAN,
  observations TEXT,
  archived BOOLEAN DEFAULT FALSE,
  school_id TEXT REFERENCES schools(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- TABELA: praises (elogios)
-- ========================================
CREATE TABLE IF NOT EXISTS praises (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  article TEXT,
  description TEXT,
  registered_by TEXT,
  archived BOOLEAN DEFAULT FALSE,
  school_id TEXT REFERENCES schools(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- TABELA: summons (convocacoes)
-- ========================================
CREATE TABLE IF NOT EXISTS summons (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  time TEXT,
  reason TEXT,
  department TEXT,
  registered_by TEXT,
  archived BOOLEAN DEFAULT FALSE,
  school_id TEXT REFERENCES schools(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- TABELA: conduct_terms (termos de conduta)
-- ========================================
CREATE TABLE IF NOT EXISTS conduct_terms (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  guardian_name TEXT,
  commitments TEXT,
  registered_by TEXT,
  archived BOOLEAN DEFAULT FALSE,
  school_id TEXT REFERENCES schools(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- TABELA: audit_logs (logs de auditoria)
-- ========================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  date TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_name TEXT, 
  entity_id TEXT, 
  details TEXT,
  user_email TEXT,
  school_id TEXT REFERENCES schools(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- TABELA: implantacao_items (checklist de implantacao)
-- ========================================
CREATE TABLE IF NOT EXISTS implantacao_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  school_id TEXT REFERENCES schools(id),
  item_key TEXT NOT NULL,
  done BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, item_key)
);

-- ========================================
-- RLS (Row Level Security) - Opcional
-- ========================================
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE accidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE praises ENABLE ROW LEVEL SECURITY;
ALTER TABLE summons ENABLE ROW LEVEL SECURITY;
ALTER TABLE conduct_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE implantacao_items ENABLE ROW LEVEL SECURITY;

-- Politicas permissivas para desenvolvimento (ajuste conforme necessario)
CREATE POLICY "Allow all for schools" ON schools FOR ALL USING (true);
CREATE POLICY "Allow all for user_profiles" ON user_profiles FOR ALL USING (true);
CREATE POLICY "Allow all for app_users" ON app_users FOR ALL USING (true);
CREATE POLICY "Allow all for students" ON students FOR ALL USING (true);
CREATE POLICY "Allow all for rules" ON rules FOR ALL USING (true);
CREATE POLICY "Allow all for occurrences" ON occurrences FOR ALL USING (true);
CREATE POLICY "Allow all for accidents" ON accidents FOR ALL USING (true);
CREATE POLICY "Allow all for praises" ON praises FOR ALL USING (true);
CREATE POLICY "Allow all for summons" ON summons FOR ALL USING (true);
CREATE POLICY "Allow all for conduct_terms" ON conduct_terms FOR ALL USING (true);
CREATE POLICY "Allow all for audit_logs" ON audit_logs FOR ALL USING (true);
CREATE POLICY "Allow all for implantacao_items" ON implantacao_items FOR ALL USING (true);

-- ========================================
-- FIM DO SCRIPT
-- ========================================
