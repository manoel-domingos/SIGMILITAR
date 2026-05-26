-- Migration: Mover todas as ocorrências criadas pelo usuário 'andrade'
-- que estão vinculadas ao tenant 'joaobatista' para o tenant 'heliodoro'.
--
-- Critério de seleção:
--   - Criador (registered_by): 'andrade'
--   - Tenant atual (school_id): 'joaobatista'
--   - Destino (school_id): 'heliodoro'

UPDATE occurrences 
SET school_id = 'heliodoro' 
WHERE registered_by = 'andrade' AND school_id = 'joaobatista';
