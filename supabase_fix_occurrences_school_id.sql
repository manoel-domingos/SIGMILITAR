-- ============================================================
-- Diagnóstico: Ocorrências registradas com school_id errado
-- ============================================================
-- Problema: O "Gestor G1 Andrade" (da Heliodoro) registrou
-- ocorrências que ficaram com school_id = 'joaobatista'
-- em vez de 'heliodoro'.
--
-- Causa: O gestor logou pelo domínio eecmprofjoaobatista.vercel.app
-- ou o perfil dele no user_profiles tem school_id = 'joaobatista'.
-- ============================================================

-- PASSO 1: Verificar o perfil do gestor
-- Execute primeiro para confirmar o school_id dele:
SELECT id, name, email, role, school_id
FROM user_profiles
WHERE name ILIKE '%Andrade%' OR email ILIKE '%andrade%';

-- PASSO 2: Ver as ocorrências registradas por ele com school_id errado
SELECT id, date, hour, registered_by, school_id, student_id
FROM occurrences
WHERE registered_by ILIKE '%Andrade%'
ORDER BY date DESC
LIMIT 20;

-- ============================================================
-- CORREÇÃO: Executar SOMENTE após confirmar os dados acima
-- ============================================================

-- PASSO 3: Corrigir o school_id do perfil do gestor (se necessário)
-- Descomente e ajuste o email correto:
-- UPDATE user_profiles
-- SET school_id = 'heliodoro'
-- WHERE email = 'email_do_gestor_andrade@exemplo.com';

-- PASSO 4: Mover as ocorrências para a escola correta
-- Descomente e ajuste conforme necessário:
-- UPDATE occurrences
-- SET school_id = 'heliodoro'
-- WHERE registered_by ILIKE '%Andrade%'
--   AND school_id = 'joaobatista';

-- ============================================================
-- Após corrigir:
-- 1. O gestor deve acessar pelo domínio correto: eecmheliodoro.vercel.app
-- 2. Ou, se for admin_global, selecionar "Heliodoro" no modal de contexto
-- ============================================================
