-- Migration 0005: MEG Pedagogico - Parte 2 (Formulários Digitais e Avaliação de Resultados)
-- Criação das tabelas meg_formularios e meg_avaliacao_resultados e configuração de políticas RLS.

CREATE TABLE IF NOT EXISTS meg_formularios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidencia_id TEXT REFERENCES meg_evidencias(id) ON DELETE CASCADE,
  school_id TEXT NOT NULL,
  tipo_formulario TEXT NOT NULL,       -- slug do tipo: 'cronograma_patrimonial', 'dfd_pcr', etc.
  dados JSONB NOT NULL DEFAULT '{}',   -- campos do formulário em JSON
  status TEXT DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'enviado', 'aprovado')),
  criado_por TEXT NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_por TEXT,
  atualizado_em TIMESTAMPTZ DEFAULT now(),
  UNIQUE(evidencia_id, school_id)
);

CREATE TABLE IF NOT EXISTS meg_avaliacao_resultados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eixo_id TEXT NOT NULL,
  school_id TEXT NOT NULL,
  avaliador TEXT NOT NULL,
  data_avaliacao DATE NOT NULL,
  respostas JSONB NOT NULL DEFAULT '{}',
  pontuacao_obtida NUMERIC(6,2),
  pontuacao_maxima NUMERIC(6,2),
  percentual NUMERIC(5,2),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(eixo_id, school_id, data_avaliacao)
);

-- Ativar RLS
ALTER TABLE meg_formularios ENABLE ROW LEVEL SECURITY;
ALTER TABLE meg_avaliacao_resultados ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para meg_formularios
CREATE POLICY "Leitura de formulários por escola" ON meg_formularios
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() ->> 'role' = 'admin_global') OR
    (school_id = COALESCE(auth.jwt() ->> 'school_id', ''))
  );

CREATE POLICY "Escrita de formulários por gestores ou admin_global" ON meg_formularios
  FOR ALL TO authenticated
  USING (
    (auth.jwt() ->> 'role' = 'admin_global') OR
    (school_id = COALESCE(auth.jwt() ->> 'school_id', '') AND auth.jwt() ->> 'role' IN ('admin_global', 'GESTOR', 'COORD'))
  )
  WITH CHECK (
    (auth.jwt() ->> 'role' = 'admin_global') OR
    (school_id = COALESCE(auth.jwt() ->> 'school_id', '') AND auth.jwt() ->> 'role' IN ('admin_global', 'GESTOR', 'COORD'))
  );

-- Políticas de RLS para meg_avaliacao_resultados
CREATE POLICY "Leitura de avaliações por escola" ON meg_avaliacao_resultados
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() ->> 'role' = 'admin_global') OR
    (school_id = COALESCE(auth.jwt() ->> 'school_id', ''))
  );

CREATE POLICY "Escrita de avaliações por gestores ou admin_global" ON meg_avaliacao_resultados
  FOR ALL TO authenticated
  USING (
    (auth.jwt() ->> 'role' = 'admin_global') OR
    (school_id = COALESCE(auth.jwt() ->> 'school_id', '') AND auth.jwt() ->> 'role' IN ('admin_global', 'GESTOR', 'COORD'))
  )
  WITH CHECK (
    (auth.jwt() ->> 'role' = 'admin_global') OR
    (school_id = COALESCE(auth.jwt() ->> 'school_id', '') AND auth.jwt() ->> 'role' IN ('admin_global', 'GESTOR', 'COORD'))
  );
