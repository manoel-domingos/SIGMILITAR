-- Adiciona colunas para controle de status na tabela occurrences

ALTER TABLE occurrences ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'iniciada';
ALTER TABLE occurrences ADD COLUMN IF NOT EXISTS solucao_acao TEXT;

-- Atualiza registros existentes
UPDATE occurrences SET status = 'resolvida' WHERE resolved = true;
