-- ============================================================================
-- VocabFlow - SQL Testing Helpers
-- Run these queries in Supabase SQL Editor (Dashboard > SQL Editor)
-- Replace <USER_ID> with your actual user UUID from auth.users
-- ============================================================================

-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │ 1. INSPECCIONAR ESTADO ACTUAL                                          │
-- └─────────────────────────────────────────────────────────────────────────┘

-- Ver tu user_id (necesario para los demás queries)
SELECT id, email FROM auth.users LIMIT 10;

-- Ver tu perfil completo
SELECT * FROM profiles WHERE id = '<USER_ID>';

-- Ver sesiones recientes
SELECT id, session_date, word_count, words_completed, is_completed
FROM daily_sessions
WHERE user_id = '<USER_ID>'
ORDER BY session_date DESC
LIMIT 10;

-- Ver palabras de hoy
SELECT lw.id, lw.word, lw.word_es, lw.is_learned, lw.interest_slug
FROM learned_words lw
JOIN daily_sessions ds ON ds.id = lw.session_id
WHERE lw.user_id = '<USER_ID>'
  AND ds.session_date = CURRENT_DATE
ORDER BY lw.created_at;

-- Ver palabras pendientes de repaso
SELECT rs.id, lw.word, lw.word_es, rs.next_review_date,
       rs.repetition_number, rs.ease_factor, rs.interval_days,
       rs.total_reviews, rs.correct_reviews
FROM review_schedule rs
JOIN learned_words lw ON lw.id = rs.word_id
WHERE rs.user_id = '<USER_ID>'
ORDER BY rs.next_review_date ASC;


-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │ 2. SIMULAR "DÍA SIGUIENTE" (probar sesión de mañana)                  │
-- └─────────────────────────────────────────────────────────────────────────┘

-- Opción A: Borrar la sesión de hoy para que se cree una nueva al recargar
DELETE FROM learned_words
WHERE session_id IN (
  SELECT id FROM daily_sessions
  WHERE user_id = '<USER_ID>' AND session_date = CURRENT_DATE
);
DELETE FROM daily_sessions
WHERE user_id = '<USER_ID>' AND session_date = CURRENT_DATE;

-- Opción B: Cambiar la fecha de la sesión de hoy a ayer
-- (así al recargar /session se creará una nueva para hoy)
UPDATE daily_sessions
SET session_date = CURRENT_DATE - INTERVAL '1 day'
WHERE user_id = '<USER_ID>' AND session_date = CURRENT_DATE;

-- También actualizar las palabras asociadas
UPDATE learned_words
SET created_at = created_at - INTERVAL '1 day'
WHERE session_id IN (
  SELECT id FROM daily_sessions
  WHERE user_id = '<USER_ID>' AND session_date = CURRENT_DATE - INTERVAL '1 day'
);


-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │ 3. FORZAR PALABRAS PARA REPASO (probar la sección /review)            │
-- └─────────────────────────────────────────────────────────────────────────┘

-- Hacer que TODAS las palabras estén pendientes de repaso HOY
UPDATE review_schedule
SET next_review_date = CURRENT_DATE
WHERE user_id = '<USER_ID>';

-- Hacer que N palabras específicas estén listas para repaso
UPDATE review_schedule
SET next_review_date = CURRENT_DATE
WHERE user_id = '<USER_ID>'
  AND word_id IN (
    SELECT id FROM learned_words
    WHERE user_id = '<USER_ID>' AND is_learned = true
    LIMIT 5  -- Cambiar el número según necesites
  );

-- Crear repasos con diferentes estados de SM-2 para probar variedad
-- Palabra fácil (muchas repeticiones, ease factor alto)
UPDATE review_schedule
SET next_review_date = CURRENT_DATE,
    repetition_number = 5,
    ease_factor = 2.8,
    interval_days = 30,
    total_reviews = 10,
    correct_reviews = 9
WHERE user_id = '<USER_ID>'
  AND word_id = (
    SELECT id FROM learned_words
    WHERE user_id = '<USER_ID>' AND is_learned = true
    LIMIT 1
  );

-- Palabra difícil (pocas repeticiones, ease factor bajo)
UPDATE review_schedule
SET next_review_date = CURRENT_DATE,
    repetition_number = 0,
    ease_factor = 1.3,
    interval_days = 1,
    total_reviews = 5,
    correct_reviews = 1
WHERE user_id = '<USER_ID>'
  AND word_id = (
    SELECT id FROM learned_words
    WHERE user_id = '<USER_ID>' AND is_learned = true
    OFFSET 1 LIMIT 1
  );


-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │ 4. PROBAR STREAKS                                                      │
-- └─────────────────────────────────────────────────────────────────────────┘

-- Simular un streak de 7 días
UPDATE profiles
SET current_streak = 7,
    longest_streak = 7,
    last_session_date = CURRENT_DATE
WHERE id = '<USER_ID>';

-- Simular streak roto (última sesión fue hace 3 días)
UPDATE profiles
SET current_streak = 5,
    longest_streak = 10,
    last_session_date = CURRENT_DATE - INTERVAL '3 days'
WHERE id = '<USER_ID>';

-- Resetear streak a 0
UPDATE profiles
SET current_streak = 0,
    longest_streak = 0,
    last_session_date = NULL
WHERE id = '<USER_ID>';


-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │ 5. INSERTAR PALABRAS DE PRUEBA MANUALMENTE                            │
-- └─────────────────────────────────────────────────────────────────────────┘

-- Primero necesitas un session_id activo. Obtén el de hoy:
-- SELECT id FROM daily_sessions WHERE user_id = '<USER_ID>' AND session_date = CURRENT_DATE;

-- Insertar palabras de ejemplo (reemplaza <SESSION_ID>)
INSERT INTO learned_words (user_id, session_id, word, ipa, example_sentence, word_es, sentence_es, interest_slug, is_learned)
VALUES
  ('<USER_ID>', '<SESSION_ID>', 'debug', '/diːˈbʌɡ/', 'I need to debug this function.', 'depurar', 'Necesito depurar esta función.', 'technology', false),
  ('<USER_ID>', '<SESSION_ID>', 'deploy', '/dɪˈplɔɪ/', 'We deploy every Friday.', 'desplegar', 'Desplegamos cada viernes.', 'technology', false),
  ('<USER_ID>', '<SESSION_ID>', 'refactor', '/riːˈfæktər/', 'Let''s refactor this module.', 'refactorizar', 'Refactoricemos este módulo.', 'technology', false);


-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │ 6. RESET COMPLETO (empezar de cero sin perder la cuenta)              │
-- └─────────────────────────────────────────────────────────────────────────┘

-- ⚠️  CUIDADO: Esto borra todo el progreso del usuario
-- Ejecutar en orden por las foreign keys

DELETE FROM review_schedule WHERE user_id = '<USER_ID>';
DELETE FROM learned_words WHERE user_id = '<USER_ID>';
DELETE FROM daily_sessions WHERE user_id = '<USER_ID>';

-- Resetear perfil (mantiene onboarding e intereses)
UPDATE profiles
SET current_streak = 0,
    longest_streak = 0,
    last_session_date = NULL
WHERE id = '<USER_ID>';


-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │ 7. VERIFICAR INTEGRIDAD DE DATOS                                      │
-- └─────────────────────────────────────────────────────────────────────────┘

-- Palabras marcadas como learned pero sin review_schedule
SELECT lw.id, lw.word
FROM learned_words lw
LEFT JOIN review_schedule rs ON rs.word_id = lw.id
WHERE lw.user_id = '<USER_ID>'
  AND lw.is_learned = true
  AND rs.id IS NULL;

-- Reviews huérfanos (sin palabra asociada)
SELECT rs.id, rs.word_id
FROM review_schedule rs
LEFT JOIN learned_words lw ON lw.id = rs.word_id
WHERE rs.user_id = '<USER_ID>'
  AND lw.id IS NULL;

-- Sesiones con conteo inconsistente
SELECT ds.id, ds.session_date, ds.words_completed,
       COUNT(lw.id) FILTER (WHERE lw.is_learned) AS actual_completed,
       ds.word_count,
       COUNT(lw.id) AS actual_total
FROM daily_sessions ds
LEFT JOIN learned_words lw ON lw.session_id = ds.id
WHERE ds.user_id = '<USER_ID>'
GROUP BY ds.id
HAVING ds.words_completed != COUNT(lw.id) FILTER (WHERE lw.is_learned);
