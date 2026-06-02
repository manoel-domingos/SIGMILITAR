-- Migration 0009: MEG Enhancements and Supabase Migration
-- Add school_settings, meg_canny_ideas, system_notifications, and sigmilitar_edit_trackers

-- 1. school_settings
CREATE TABLE IF NOT EXISTS school_settings (
    school_id TEXT PRIMARY KEY,
    drive_folder_id TEXT,
    updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by TEXT
);

-- Seed initial settings if schools exist
INSERT INTO school_settings (school_id, drive_folder_id)
VALUES 
('joaobatista', '1B_d2bB2_drive_joaobatista_id'),
('heliodoro', '1H_d3hH3_drive_heliodoro_id'),
('tangara', '1T_d4tT4_drive_tangara_id')
ON CONFLICT (school_id) DO NOTHING;

-- 2. meg_canny_ideas
CREATE TABLE IF NOT EXISTS meg_canny_ideas (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'Geral',
    status TEXT DEFAULT 'Aberto' CHECK (status IN ('Aberto', 'Planejado', 'Em progresso', 'Concluido')),
    votes INTEGER DEFAULT 1,
    voted_by TEXT[] DEFAULT '{}',
    created_by TEXT NOT NULL,
    created_by_name TEXT,
    created_school TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed initial ideas
INSERT INTO meg_canny_ideas (id, school_id, title, description, category, status, votes, voted_by, created_by, created_by_name, created_school, created_at)
VALUES
('idea-1', 'joaobatista', 'Integração de assinatura digital para Termo de Compromisso', 'Permitir que os responsáveis assinem os termos de ocorrências diretamente pela tela do celular usando assinatura na tela (touch).', 'Disciplinar', 'Em progresso', 42, '{}', 'diretor@escola.gov.br', 'Diretor João', 'EECM João Batista', '2026-05-15T10:00:00Z'),
('idea-2', 'heliodoro', 'Upload automático em lote de fotos de alunos', 'Uma área para fazer upload de múltiplos arquivos de fotos nomeados pelo número de matrícula do aluno e associar automaticamente.', 'Pedagógico', 'Planejado', 28, '{}', 'coordenador@escola.gov.br', 'Coordenadora Maria', 'EECM Heliodoro', '2026-05-20T14:30:00Z'),
('idea-3', 'joaobatista', 'Relatório unificado de recidiva por turma', 'Gráfico e tabela exportáveis mostrando o índice de alunos recorrentes em infrações graves em cada turma para acompanhamento psicossocial.', 'Pedagógico', 'Aberto', 19, '{}', 'psicologa@escola.gov.br', 'Dra. Ana (Psicóloga)', 'EECM João Batista', '2026-05-25T09:15:00Z'),
('idea-4', 'heliodoro', 'Indicador visual de espaço ocupado no Google Drive', 'Exibir no painel de configurações a porcentagem de armazenamento restante e os MBs consumidos na pasta do Drive configurada.', 'Drive', 'Aberto', 11, '{}', 'suporte@meg.com.br', 'Técnico Carlos', 'EECM Heliodoro', '2026-05-30T11:45:00Z'),
('idea-5', 'joaobatista', 'Bypass de segurança automático para conexões do Vercel', 'Automatizado envio de variáveis de ambiente do Drive para evitar erros de autenticação na hospedagem da nuvem.', 'Geral', 'Concluido', 35, '{}', 'admin@meg.com.br', 'Administrador Global', 'EECM João Batista', '2026-05-28T16:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- 3. system_notifications
CREATE TABLE IF NOT EXISTS system_notifications (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    desc_content TEXT, -- avoiding reserved keyword 'desc'
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning')),
    is_update BOOLEAN DEFAULT false,
    version TEXT,
    commits TEXT[] DEFAULT '{}',
    school_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    deleted_by TEXT[] DEFAULT '{}'
);

-- Seed initial notifications
INSERT INTO system_notifications (id, title, desc_content, type, is_update, created_at)
VALUES
('notif-1', 'Bem-vindo ao Novo EECM', 'Painel multitenant integrado e sincronizado em tempo real.', 'info', false, '2026-06-01T12:00:00Z'),
('notif-2', 'Modo Professor Liberado', 'Professor agora possui acesso seguro e direto às suas ocorrências.', 'success', false, '2026-05-31T12:00:00Z'),
('notif-3', 'Segurança de Whitelist Ativa', 'Seu e-mail está cadastrado e validado com sucesso.', 'warning', false, '2026-05-30T12:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Seed initial updates
INSERT INTO system_notifications (id, title, version, commits, is_update, created_at)
VALUES
('update-v1.2.6', 'Notificações & TL;DR Changelog', 'v1.2.6', ARRAY['Adicionado sino de notificações no cabeçalho com abas rápidas.', 'Desenvolvido changelog em tempo real com resumo TL;DR a cada 3 commits.', 'Aprimoramentos de design de cards nas abas de relatórios.'], true, '2026-05-25T10:00:00Z'),
('update-v1.2.5', 'Transições de Abas & Painel do Professor', 'v1.2.5', ARRAY['Adicionada transição vertical "subindo" (rolling animation, 300ms).', 'Liberada aba Alunos em modo leitura ampla para toda a escola.', 'Implementadas abas Faltas Disciplinares e Relatórios Estatísticos para Professores.'], true, '2026-05-25T09:00:00Z'),
('update-v1.2.4', 'Supabase Sync & Google SSO', 'v1.2.4', ARRAY['Reorganização da tela de login com animação expansiva de inputs.', 'Implementado login premium com Google SSO.', 'Casamento dinâmico de turmas na importação de planilhas.'], true, '2026-05-24T08:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- 4. sigmilitar_edit_trackers
CREATE TABLE IF NOT EXISTS sigmilitar_edit_trackers (
    email TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    edit_count INTEGER DEFAULT 0 NOT NULL,
    recent_edits JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE school_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meg_canny_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE sigmilitar_edit_trackers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for school_settings
CREATE POLICY "Leitura de school_settings por escola ou admin" ON school_settings
    FOR SELECT TO authenticated
    USING (
        (auth.jwt() ->> 'role' = 'admin_global') OR
        (school_id = COALESCE(auth.jwt() ->> 'school_id', ''))
    );

CREATE POLICY "Escrita de school_settings por gestores ou admin" ON school_settings
    FOR ALL TO authenticated
    USING (
        (auth.jwt() ->> 'role' = 'admin_global') OR
        (school_id = COALESCE(auth.jwt() ->> 'school_id', '') AND auth.jwt() ->> 'role' IN ('admin_global', 'GESTOR', 'COORD'))
    )
    WITH CHECK (
        (auth.jwt() ->> 'role' = 'admin_global') OR
        (school_id = COALESCE(auth.jwt() ->> 'school_id', '') AND auth.jwt() ->> 'role' IN ('admin_global', 'GESTOR', 'COORD'))
    );

-- RLS Policies for meg_canny_ideas
CREATE POLICY "Leitura de ideias por autenticados" ON meg_canny_ideas
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Inserção de ideias por autenticados" ON meg_canny_ideas
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Atualização de ideias por autenticados" ON meg_canny_ideas
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Exclusão de ideias por gestores ou admin" ON meg_canny_ideas
    FOR DELETE TO authenticated
    USING (
        (auth.jwt() ->> 'role' = 'admin_global') OR
        (auth.jwt() ->> 'role' = 'GESTOR')
    );

-- RLS Policies for system_notifications
CREATE POLICY "Leitura de notificacoes por escola ou admin" ON system_notifications
    FOR SELECT TO authenticated
    USING (
        (school_id IS NULL) OR
        (auth.jwt() ->> 'role' = 'admin_global') OR
        (school_id = COALESCE(auth.jwt() ->> 'school_id', ''))
    );

CREATE POLICY "Inserção de notificacoes por autenticados" ON system_notifications
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Atualização de notificacoes por autenticados" ON system_notifications
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Exclusão de notificacoes por gestores ou admin" ON system_notifications
    FOR DELETE TO authenticated
    USING (
        (auth.jwt() ->> 'role' = 'admin_global') OR
        (auth.jwt() ->> 'role' = 'GESTOR')
    );

-- RLS Policies for sigmilitar_edit_trackers
CREATE POLICY "Leitura de tracker por email" ON sigmilitar_edit_trackers
    FOR SELECT TO authenticated
    USING (
        (email = COALESCE(auth.jwt() ->> 'email', '')) OR
        (auth.jwt() ->> 'role' = 'admin_global')
    );

CREATE POLICY "Escrita de tracker por email" ON sigmilitar_edit_trackers
    FOR ALL TO authenticated
    USING (
        (email = COALESCE(auth.jwt() ->> 'email', '')) OR
        (auth.jwt() ->> 'role' = 'admin_global')
    )
    WITH CHECK (
        (email = COALESCE(auth.jwt() ->> 'email', '')) OR
        (auth.jwt() ->> 'role' = 'admin_global')
    );
