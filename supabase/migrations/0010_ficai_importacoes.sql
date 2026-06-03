-- Migration 0010: FICAI Importações
-- Tabela para armazenar os dados importados da planilha FICAI no módulo Psicossocial

CREATE TABLE IF NOT EXISTS public.ficai_importacoes (
  id              UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  ano             INTEGER      NOT NULL,
  cod_aluno       BIGINT,
  cod_matricula   BIGINT,
  nome_aluno      TEXT         NOT NULL,
  turma           TEXT,
  turno           TEXT,
  modalidade      TEXT,
  school_id       TEXT,

  -- Frequência
  perc_faltas_geral   INTEGER,
  perc_faltas_1bim    INTEGER,
  perc_faltas_2bim    INTEGER,

  -- FICAI
  ficai_aberto        BOOLEAN  DEFAULT FALSE,
  data_ficai          TEXT,
  encaminhado         BOOLEAN  DEFAULT FALSE,
  data_encaminhamento TEXT,

  -- Referência ao aluno cadastrado no sistema
  aluno_id        UUID         REFERENCES public.students(id) ON DELETE SET NULL,
  match_score     FLOAT,

  -- Auditoria
  importado_em    TIMESTAMPTZ  DEFAULT NOW(),
  importado_por   UUID         REFERENCES auth.users(id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS ficai_importacoes_cod_aluno_idx ON public.ficai_importacoes (cod_aluno);
CREATE INDEX IF NOT EXISTS ficai_importacoes_ano_idx       ON public.ficai_importacoes (ano);
CREATE INDEX IF NOT EXISTS ficai_importacoes_school_idx    ON public.ficai_importacoes (school_id);
CREATE UNIQUE INDEX IF NOT EXISTS ficai_importacoes_uniq   ON public.ficai_importacoes (cod_aluno, ano)
  WHERE cod_aluno IS NOT NULL;

-- Row Level Security
ALTER TABLE public.ficai_importacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem gerenciar importações por escola ou admin" ON public.ficai_importacoes;

CREATE POLICY "Usuários podem gerenciar importações por escola ou admin"
  ON public.ficai_importacoes
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'role' = 'admin_global') OR
    (school_id = COALESCE(auth.jwt() ->> 'school_id', ''))
  );
