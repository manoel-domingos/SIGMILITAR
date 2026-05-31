-- Migration: Mover todas as ocorrências criadas pelo usuário 'andrade'
-- que estão vinculadas ao tenant 'joaobatista' para o tenant 'heliodoro'.
--
-- Critério de seleção:
--   - Criador (registered_by): 'andrade'
--   - Tenant atual (school_id): 'joaobatista'
--   - Destino (school_id): 'heliodoro'

-- Add school_id column to core tables for multi-tenant support
ALTER TABLE students ADD COLUMN IF NOT EXISTS school_id TEXT NOT NULL DEFAULT 'joaobatista';
ALTER TABLE rules ADD COLUMN IF NOT EXISTS school_id TEXT NOT NULL DEFAULT 'joaobatista';
ALTER TABLE occurrences ADD COLUMN IF NOT EXISTS school_id TEXT NOT NULL DEFAULT 'joaobatista';
ALTER TABLE accidents ADD COLUMN IF NOT EXISTS school_id TEXT NOT NULL DEFAULT 'joaobatista';
ALTER TABLE praises ADD COLUMN IF NOT EXISTS school_id TEXT NOT NULL DEFAULT 'joaobatista';

UPDATE occurrences 
SET school_id = 'heliodoro' 
WHERE registered_by = 'andrade' AND school_id = 'joaobatista';

