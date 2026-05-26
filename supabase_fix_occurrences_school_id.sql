-- ============================================================
-- CORREÇÃO: Remover ocorrências da João Batista registradas por
-- Gestor G1 Andrade e movê-las para Heliodoro
-- ============================================================

-- 1. Mover todas as ocorrências de Gestor G1 Andrade para heliodoro
UPDATE occurrences
SET school_id = 'heliodoro'
WHERE registered_by = 'Gestor G1 Andrade'
  AND school_id = 'joaobatista';

-- 2. Garantir que o perfil do Gestor G1 Andrade esteja vinculado à Heliodoro
UPDATE user_profiles
SET school_id = 'heliodoro'
WHERE name = 'Gestor G1 Andrade' OR email ILIKE '%andrade%';
