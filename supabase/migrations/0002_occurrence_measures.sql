-- Migration: adiciona campos de múltiplas medidas e status de resolução
-- Rode manualmente no Supabase Console > SQL Editor

ALTER TABLE occurrences ADD COLUMN IF NOT EXISTS measures text[] DEFAULT '{}';
ALTER TABLE occurrences ADD COLUMN IF NOT EXISTS resolved boolean DEFAULT false;
ALTER TABLE occurrences ADD COLUMN IF NOT EXISTS resolved_at timestamptz;
