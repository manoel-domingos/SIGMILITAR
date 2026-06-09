-- Migration 0020: cabeçalho/rodapé/logo de impressão configuráveis por escola (vindos do BD)
-- Colunas usadas pelos builders de impressão (lib/print-header.ts) e pelo modal em Configurações.

ALTER TABLE public.school_settings
  ADD COLUMN IF NOT EXISTS print_logo_url       TEXT,   -- brasão da escola (direita do cabeçalho)
  ADD COLUMN IF NOT EXISTS print_seduc_logo_url TEXT,   -- logo SEDUC/Governo (esquerda)
  ADD COLUMN IF NOT EXISTS print_header_lines   JSONB,  -- array de strings: linhas centrais do cabeçalho
  ADD COLUMN IF NOT EXISTS print_footer_lines   JSONB;  -- array de strings: linhas do rodapé
