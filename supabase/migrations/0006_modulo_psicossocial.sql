-- Migration 0006: Módulo Psicossocial
-- Criação das tabelas ocorrencias, fichas_notificacao, acompanhamentos e agenda_preventiva.

CREATE TABLE IF NOT EXISTS ocorrencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id TEXT NOT NULL,
  data_notificacao DATE NOT NULL,
  municipio TEXT,
  uf TEXT DEFAULT 'MT',
  escola_nome TEXT,
  estudantes JSONB DEFAULT '[]',   -- [{nome, serie, turma, idade, situacao}]
  responsaveis JSONB DEFAULT '[]',    -- [{nome, telefone, parentesco}]
  tipos_violencia TEXT[],  -- array com os tipos selecionados
  relato TEXT,    -- sem julgamento ou juízo de valor
  testemunhas JSONB DEFAULT '[]',     -- [{nome}] ou null
  procedimento_executado TEXT,  -- enum
  responsaveis_acionados TEXT,  -- enum: telefone | reuniao | nao_acionado
  motivo_nao_acionamento TEXT,
  conversa_registrada_ata BOOLEAN DEFAULT false,
  responsaveis_concordaram BOOLEAN DEFAULT false,
  motivo_discordancia TEXT,
  orientados_bo BOOLEAN DEFAULT false,
  motivo_sem_bo TEXT,
  historico_estudante BOOLEAN DEFAULT false,
  historico_descricao TEXT,
  quem_preencheu TEXT,
  assinatura_gestao TEXT,
  status TEXT DEFAULT 'aberto',  -- aberto | em_acompanhamento | encerrado
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

CREATE TABLE IF NOT EXISTS fichas_notificacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id TEXT NOT NULL,
  ocorrencia_id UUID REFERENCES ocorrencias(id) ON DELETE SET NULL,
  data_notificacao DATE NOT NULL,
  municipio_notificacao TEXT,
  uf TEXT DEFAULT 'MT',
  escola_nome TEXT,
  endereco_escola TEXT,
  nome_estudante TEXT NOT NULL,
  data_nascimento DATE,
  idade INTEGER,
  sexo TEXT,   -- M | F | outro
  cartao_sus TEXT,
  escolaridade TEXT,
  deficiencia TEXT,   -- null ou descrição
  responsaveis JSONB DEFAULT '[]',
  endereco_responsavel TEXT,
  telefone TEXT,
  cep TEXT,
  tipo_violacao TEXT[], -- enum
  informacoes_complementares TEXT,
  nome_diretor TEXT,
  assinatura_diretor TEXT,
  ficha_enviada_em TIMESTAMPTZ,
  ficha_enviada_para TEXT[], -- conselho_tutelar | autoridade_policial | sistema_saude | assistencia_social
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

CREATE TABLE IF NOT EXISTS acompanhamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id TEXT NOT NULL,
  ocorrencia_id UUID NOT NULL REFERENCES ocorrencias(id) ON DELETE CASCADE,
  data_registro DATE NOT NULL,
  descricao TEXT NOT NULL,
  tipo_acao TEXT,   -- acolhimento | encaminhamento | retorno | reuniao | outro
  responsavel TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agenda_preventiva (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  tematica TEXT,   -- enum
  eixo TEXT,   -- prevencao | acao_intervencao | pos_violencia
  data_inicio DATE,
  data_fim DATE,
  periodicidade TEXT, -- eventual | semanal | mensal | bimestral | anual
  publico_alvo TEXT,  -- estudantes | professores | pais | todos
  status TEXT DEFAULT 'planejado',  -- planejado | em_andamento | realizado | cancelado
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ativar Row Level Security
ALTER TABLE ocorrencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE fichas_notificacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE acompanhamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_preventiva ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para ocorrencias
CREATE POLICY "Leitura de ocorrencias por escola" ON ocorrencias
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() ->> 'role' = 'admin_global') OR
    (school_id = COALESCE(auth.jwt() ->> 'school_id', ''))
  );

CREATE POLICY "Escrita de ocorrencias por gestores ou admin_global" ON ocorrencias
  FOR ALL TO authenticated
  USING (
    (auth.jwt() ->> 'role' = 'admin_global') OR
    (school_id = COALESCE(auth.jwt() ->> 'school_id', '') AND auth.jwt() ->> 'role' IN ('admin_global', 'GESTOR', 'COORD'))
  )
  WITH CHECK (
    (auth.jwt() ->> 'role' = 'admin_global') OR
    (school_id = COALESCE(auth.jwt() ->> 'school_id', '') AND auth.jwt() ->> 'role' IN ('admin_global', 'GESTOR', 'COORD'))
  );

-- Políticas de RLS para fichas_notificacao
CREATE POLICY "Leitura de fichas_notificacao por escola" ON fichas_notificacao
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() ->> 'role' = 'admin_global') OR
    (school_id = COALESCE(auth.jwt() ->> 'school_id', ''))
  );

CREATE POLICY "Escrita de fichas_notificacao por gestores ou admin_global" ON fichas_notificacao
  FOR ALL TO authenticated
  USING (
    (auth.jwt() ->> 'role' = 'admin_global') OR
    (school_id = COALESCE(auth.jwt() ->> 'school_id', '') AND auth.jwt() ->> 'role' IN ('admin_global', 'GESTOR', 'COORD'))
  )
  WITH CHECK (
    (auth.jwt() ->> 'role' = 'admin_global') OR
    (school_id = COALESCE(auth.jwt() ->> 'school_id', '') AND auth.jwt() ->> 'role' IN ('admin_global', 'GESTOR', 'COORD'))
  );

-- Políticas de RLS para acompanhamentos
CREATE POLICY "Leitura de acompanhamentos por escola" ON acompanhamentos
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() ->> 'role' = 'admin_global') OR
    (school_id = COALESCE(auth.jwt() ->> 'school_id', ''))
  );

CREATE POLICY "Escrita de acompanhamentos por gestores ou admin_global" ON acompanhamentos
  FOR ALL TO authenticated
  USING (
    (auth.jwt() ->> 'role' = 'admin_global') OR
    (school_id = COALESCE(auth.jwt() ->> 'school_id', '') AND auth.jwt() ->> 'role' IN ('admin_global', 'GESTOR', 'COORD'))
  )
  WITH CHECK (
    (auth.jwt() ->> 'role' = 'admin_global') OR
    (school_id = COALESCE(auth.jwt() ->> 'school_id', '') AND auth.jwt() ->> 'role' IN ('admin_global', 'GESTOR', 'COORD'))
  );

-- Políticas de RLS para agenda_preventiva
CREATE POLICY "Leitura de agenda_preventiva por escola" ON agenda_preventiva
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() ->> 'role' = 'admin_global') OR
    (school_id = COALESCE(auth.jwt() ->> 'school_id', ''))
  );

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
