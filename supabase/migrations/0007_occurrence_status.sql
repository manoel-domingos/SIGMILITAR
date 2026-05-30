-- Adiciona colunas para controle de status na tabela occurrences

ALTER TABLE occurrences ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'iniciada';
ALTER TABLE occurrences ADD COLUMN IF NOT EXISTS solucao_acao TEXT;

-- Adiciona validacao de dominio para o status
ALTER TABLE occurrences ADD CONSTRAINT chk_occurrence_status CHECK (status IN ('iniciada', 'em tratamento', 'resolvida'));

-- Atualiza registros existentes
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='occurrences' AND column_name='resolved'
    ) THEN
        EXECUTE 'UPDATE occurrences SET status = ''resolvida'' WHERE resolved = true';
    END IF;
END $$;
