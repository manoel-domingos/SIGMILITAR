-- Migration 0004: Gestão Pedagógica (MEG Educação)
-- Tabelas globais para Eixos, Fases e Evidências, e tabela específica por escola para o checklist.

CREATE TABLE IF NOT EXISTS meg_eixos (
    id TEXT PRIMARY KEY,
    numero INTEGER NOT NULL,
    nome TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS meg_fases (
    id TEXT PRIMARY KEY,
    numero INTEGER NOT NULL,
    nome TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS meg_evidencias (
    id TEXT PRIMARY KEY,
    eixo_id TEXT REFERENCES meg_eixos(id) ON DELETE CASCADE,
    fase_id TEXT REFERENCES meg_fases(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    descricao TEXT,
    ordem INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS meg_checklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id TEXT NOT NULL,
    evidencia_id TEXT REFERENCES meg_evidencias(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluido')),
    observacao TEXT,
    arquivo_url TEXT,
    atualizado_por TEXT,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    CONSTRAINT unique_school_evidencia UNIQUE(school_id, evidencia_id)
);

-- Ativar RLS
ALTER TABLE meg_eixos ENABLE ROW LEVEL SECURITY;
ALTER TABLE meg_fases ENABLE ROW LEVEL SECURITY;
ALTER TABLE meg_evidencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE meg_checklist ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para tabelas de apoio (leitura livre para autenticados)
CREATE POLICY "Leitura livre de eixos para autenticados" ON meg_eixos 
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Leitura livre de fases para autenticados" ON meg_fases 
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Leitura livre de evidencias para autenticados" ON meg_evidencias 
    FOR SELECT TO authenticated USING (true);

-- Políticas de RLS para meg_checklist (multi-tenant)
CREATE POLICY "Leitura de checklist por escola" ON meg_checklist
    FOR SELECT TO authenticated 
    USING (
        -- admin_global pode ver tudo
        (auth.jwt() ->> 'role' = 'admin_global') OR
        -- Usuarios comuns só veem dados da própria escola
        (school_id = COALESCE(auth.jwt() ->> 'school_id', ''))
    );

CREATE POLICY "Escrita de checklist por gestores ou admin_global" ON meg_checklist
    FOR ALL TO authenticated
    USING (
        (auth.jwt() ->> 'role' = 'admin_global') OR
        (school_id = COALESCE(auth.jwt() ->> 'school_id', '') AND auth.jwt() ->> 'role' IN ('admin_global', 'GESTOR', 'COORD'))
    )
    WITH CHECK (
        (auth.jwt() ->> 'role' = 'admin_global') OR
        (school_id = COALESCE(auth.jwt() ->> 'school_id', '') AND auth.jwt() ->> 'role' IN ('admin_global', 'GESTOR', 'COORD'))
    );

-- SEED DOS EIXOS
INSERT INTO meg_eixos (id, numero, nome, slug) VALUES
('gestao-escolar', 1, 'Planejamento Estratégico e Gestão Escolar', 'gestao-escolar'),
('lideranca', 2, 'Gestão de Pessoas e Liderança', 'lideranca'),
('pedagogico', 3, 'Gestão de Processos Pedagógicos', 'pedagogico'),
('patrimonio', 4, 'Gestão de Recursos e Patrimônio', 'patrimonio'),
('clima-escolar', 5, 'Gestão de Resultados e Clima Escolar', 'clima-escolar')
ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, numero = EXCLUDED.numero, slug = EXCLUDED.slug;

-- SEED DAS FASES
INSERT INTO meg_fases (id, numero, nome, slug) VALUES
('planejamento', 1, 'Planejamento', 'planejamento'),
('execucao', 2, 'Execução', 'execucao'),
('controle', 3, 'Controle e Avaliação de Qualidade e Eficiência', 'controle'),
('melhorias', 4, 'Implementação de Melhorias', 'melhorias'),
('resultados', 5, 'Avaliação de Resultados', 'resultados')
ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, numero = EXCLUDED.numero, slug = EXCLUDED.slug;

-- SEED DAS EVIDÊNCIAS (Exemplos representativos do MEG Educação)
INSERT INTO meg_evidencias (id, eixo_id, fase_id, nome, descricao, ordem) VALUES
-- Eixo 1 - Gestão Escolar
('e1_f1_1', 'gestao-escolar', 'planejamento', 'Projeto Político Pedagógico (PPP) Atualizado', 'PPP revisado e alinhado com as diretrizes do MEG Educação.', 1),
('e1_f1_2', 'gestao-escolar', 'planejamento', 'Plano de Ação Anual da Escola', 'Documento contendo metas, prazos e responsabilidades para o ano letivo.', 2),
('e1_f2_1', 'gestao-escolar', 'execucao', 'Registro de Reuniões de Alinhamento Coletivo', 'Atas e fotos de reuniões realizadas com a equipe escolar.', 1),
('e1_f3_1', 'gestao-escolar', 'controle', 'Relatório de Acompanhamento das Metas do PPP', 'Planilha ou relatório indicando a evolução do cumprimento das metas.', 1),
('e1_f4_1', 'gestao-escolar', 'melhorias', 'Plano de Intervenção para Metas Não Atingidas', 'Ações corretivas traçadas após a análise das metas do semestre.', 1),
('e1_f5_1', 'gestao-escolar', 'resultados', 'Relatório de Avaliação Institucional', 'Resultados de questionários aplicados à comunidade escolar sobre a gestão.', 1),

-- Eixo 2 - Liderança
('e2_f1_1', 'lideranca', 'planejamento', 'Plano de Formação Continuada dos Servidores', 'Cronograma e temas de treinamento para professores e funcionários.', 1),
('e2_f2_1', 'lideranca', 'execucao', 'Portfólio de Formações Realizadas na Escola', 'Certificados, listas de presença e registros de oficinas executadas.', 1),
('e2_f3_1', 'lideranca', 'controle', 'Fichas de Avaliação de Desempenho e Feedback', 'Registros de conversas de feedback e metas profissionais de desenvolvimento.', 1),
('e2_f4_1', 'lideranca', 'melhorias', 'Plano de Redirecionamento de Liderança', 'Medidas adotadas para resolver lacunas de capacitação da equipe.', 1),
('e2_f5_1', 'lideranca', 'resultados', 'Pesquisa de Clima Organizacional Interno', 'Avaliação anual da satisfação e motivação da equipe escolar.', 1),

-- Eixo 3 - Processos Pedagógicos
('e3_f1_1', 'pedagogico', 'planejamento', 'Planejamento de Aulas por Área do Conhecimento', 'Planos de ensino mensais ou bimestrais elaborados pelos docentes.', 1),
('e3_f1_2', 'pedagogico', 'planejamento', 'Plano de Recuperação Paralela de Aprendizagem', 'Estratégia para alunos com aproveitamento abaixo do esperado.', 2),
('e3_f2_1', 'pedagogico', 'execucao', 'Diários de Classe Homologados e Fichas de Aula', 'Registro de conteúdos ministrados e frequência dos alunos.', 1),
('e3_f3_1', 'pedagogico', 'controle', 'Relatório Mensal de Faltas e Notas Pedagógicas', 'Planilha consolidada de acompanhamento de notas e faltas.', 1),
('e3_f4_1', 'pedagogico', 'melhorias', 'Ações de Reforço Escolar Desenvolvidas no Período', 'Cronograma e lista de estudantes participantes do contraturno.', 1),
('e3_f5_1', 'pedagogico', 'resultados', 'Planilha de Desempenho nas Avaliações Externas', 'Resultados do IDEB, Avalia-MT e simulados escolares.', 1),

-- Eixo 4 - Recursos e Patrimônio
('e4_f1_1', 'patrimonio', 'planejamento', 'Plano de Manutenção Preventiva do Prédio Escolar', 'Cronograma de vistorias prediais e reparos periódicos.', 1),
('e4_f1_2', 'patrimonio', 'planejamento', 'Orçamento e Plano de Aplicação de Recursos Financeiros', 'Detalhamento de gastos planejados com verbas recebidas.', 2),
('e4_f2_1', 'patrimonio', 'execucao', 'Livro de Controle de Almoxarifado e Estoque', 'Registro de entrada e saída de materiais didáticos e consumo.', 1),
('e4_f2_2', 'patrimonio', 'execucao', 'Registro de Manutenção Corretiva Executada', 'Notas fiscais e ordens de serviço de reformas urgentes.', 2),
('e4_f3_1', 'patrimonio', 'controle', 'Prestação de Contas Aprovada pelo Conselho Escolar', 'Balancete financeiro assinado pela comunidade e conselho.', 1),
('e4_f4_1', 'patrimonio', 'melhorias', 'Plano de Otimização do Consumo de Recursos', 'Estratégia para redução de perdas de água, energia ou papel.', 1),
('e4_f5_1', 'patrimonio', 'resultados', 'Termo de Inventário Patrimonial Anual Consolidado', 'Lista de todos os bens tombados e em uso na unidade escolar.', 1),

-- Eixo 5 - Clima Escolar e Resultados
('e5_f1_1', 'clima-escolar', 'planejamento', 'Plano de Ações Sociais e Interação Comunitária', 'Eventos integradores com a família e a comunidade planejados.', 1),
('e5_f2_1', 'clima-escolar', 'execucao', 'Registro de Atividades Cívicas e Projetos Sociais', 'Atividades realizadas de civismo, eventos beneficentes ou palestras.', 1),
('e5_f3_1', 'clima-escolar', 'controle', 'Relatório Consolidado de Ocorrências e Convivência', 'Estatísticas de infrações disciplinares analisadas periodicamente.', 1),
('e5_f4_1', 'clima-escolar', 'melhorias', 'Plano de Mediação de Conflitos e Círculos Restaurativos', 'Projetos pedagógicos focados na redução da violência escolar.', 1),
('e5_f5_1', 'clima-escolar', 'resultados', 'Índice de Evasão e Reprovação Escolar Reduzidos', 'Comparativo estatístico anual dos índices de evasão/sucesso.', 1)
ON CONFLICT (id) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    descricao = EXCLUDED.descricao, 
    ordem = EXCLUDED.ordem;
