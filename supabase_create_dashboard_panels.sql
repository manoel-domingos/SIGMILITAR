-- ============================================================
-- Script: Criar tabela dashboard_panels
-- Objetivo: Armazenar a configuração de painéis do dashboard
--           (ordem e visibilidade) por usuário.
-- 
-- Execute este script no Supabase SQL Editor:
--   https://supabase.com/dashboard → seu projeto → SQL Editor
-- ============================================================

-- 1. Criar a tabela
CREATE TABLE IF NOT EXISTS dashboard_panels (
  user_id   TEXT        PRIMARY KEY,
  panels    JSONB       NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Adicionar comentário descritivo
COMMENT ON TABLE dashboard_panels IS 'Configuração de painéis do dashboard por usuário (ordem e visibilidade)';

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE dashboard_panels ENABLE ROW LEVEL SECURITY;

-- 4. Política: cada usuário só lê/escreve suas próprias configurações
CREATE POLICY "Users can read own panels"
  ON dashboard_panels
  FOR SELECT
  USING (auth.jwt() ->> 'email' = user_id);

CREATE POLICY "Users can insert own panels"
  ON dashboard_panels
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = user_id);

CREATE POLICY "Users can update own panels"
  ON dashboard_panels
  FOR UPDATE
  USING (auth.jwt() ->> 'email' = user_id)
  WITH CHECK (auth.jwt() ->> 'email' = user_id);

-- 5. Índice para buscas rápidas (PK já cria, mas explícito por clareza)
-- Nenhum índice adicional necessário — user_id é a PK.

-- ============================================================
-- Pronto! Após executar, o erro 406 (Not Acceptable) será resolvido.
-- ============================================================
