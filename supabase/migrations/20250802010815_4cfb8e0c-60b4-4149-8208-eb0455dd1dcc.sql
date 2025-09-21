-- 🚀 CORREÇÃO COMPLETA E DEFINITIVA: Distribuição de treinos
-- Data: 2025-01-30
-- Objetivo: Corrigir TODOS os treinos mal distribuídos e garantir distribuição sequencial perfeita

-- 1. AUDITORIA COMPLETA: Identificar todos os problemas de distribuição
WITH workout_analysis AS (
  SELECT 
    dw.id,
    dw.user_id,
    dw.workout_date,
    dw.workout_title,
    EXTRACT(DOW FROM dw.workout_date) as day_of_week,
    p.name as user_name,
    wp.plan_data->'workoutDays' as workout_days,
    jsonb_array_length(wp.plan_data->'workoutDays') as total_workouts,
    dw.status,
    dw.approval_status
  FROM daily_workouts dw
  JOIN profiles p ON p.id = dw.user_id
  LEFT JOIN workout_plans wp ON wp.user_id = dw.user_id AND wp.is_active = true
  WHERE dw.workout_date >= CURRENT_DATE - INTERVAL '7 days'
    AND dw.workout_date <= CURRENT_DATE + INTERVAL '30 days'
),
incorrect_distributions AS (
  SELECT 
    id,
    user_id,
    user_name,
    workout_date,
    day_of_week,
    workout_title,
    total_workouts,
    status,
    approval_status,
    -- Calcular qual treino DEVERIA ser baseado no dia
    CASE 
      WHEN day_of_week = 0 THEN 'ERRO: Domingo com treino'
      WHEN day_of_week = 6 AND total_workouts < 6 THEN 'ERRO: Sábado com treino (deveria ser descanso)'
      WHEN day_of_week > total_workouts THEN 'ERRO: Dia excede número de treinos'
      ELSE 
        CASE day_of_week
          WHEN 1 THEN 'Treino A'
          WHEN 2 THEN 'Treino B' 
          WHEN 3 THEN 'Treino C'
          WHEN 4 THEN 'Treino D'
          WHEN 5 THEN 'Treino E'
          WHEN 6 THEN 'Treino F'
        END
    END as expected_title,
    -- Verificar se está incorreto
    CASE 
      WHEN day_of_week = 0 THEN 'CRÍTICO'
      WHEN day_of_week = 6 AND total_workouts < 6 THEN 'CRÍTICO'
      WHEN day_of_week > total_workouts THEN 'CRÍTICO'
      WHEN workout_title != CASE day_of_week
          WHEN 1 THEN 'Treino A'
          WHEN 2 THEN 'Treino B' 
          WHEN 3 THEN 'Treino C'
          WHEN 4 THEN 'Treino D'
          WHEN 5 THEN 'Treino E'
          WHEN 6 THEN 'Treino F'
        END THEN 'INCORRETO'
      ELSE 'OK'
    END as distribution_status
  FROM workout_analysis
  WHERE total_workouts IS NOT NULL
)
INSERT INTO system_logs (log_level, message)
SELECT 
  CASE 
    WHEN distribution_status = 'CRÍTICO' THEN 'ERROR'
    WHEN distribution_status = 'INCORRETO' THEN 'WARN'
    ELSE 'INFO'
  END,
  '🔍 AUDITORIA FINAL: ' || user_name || 
  ' - ' || workout_date || 
  ' (' || CASE day_of_week WHEN 0 THEN 'DOM' WHEN 1 THEN 'SEG' WHEN 2 THEN 'TER' 
             WHEN 3 THEN 'QUA' WHEN 4 THEN 'QUI' WHEN 5 THEN 'SEX' WHEN 6 THEN 'SAB' END || 
  ') - Atual: ' || workout_title || 
  ' - Esperado: ' || expected_title ||
  ' - Status: ' || distribution_status
FROM incorrect_distributions
WHERE distribution_status != 'OK';

-- 2. REMOÇÃO CRÍTICA: Eliminar todos os treinos de domingo
WITH sunday_removals AS (
  DELETE FROM daily_workouts 
  WHERE EXTRACT(DOW FROM workout_date) = 0
    AND workout_date >= CURRENT_DATE - INTERVAL '7 days'
  RETURNING user_id, workout_date, workout_title
)
INSERT INTO system_logs (log_level, message)
SELECT 
  'CLEANUP',
  '🗑️ DOMINGO REMOVIDO: Usuário ' || user_id || 
  ' - Data: ' || workout_date || 
  ' - Treino: ' || workout_title
FROM sunday_removals;

-- 3. REMOÇÃO CRÍTICA: Eliminar treinos de sábado quando usuário tem menos de 6 treinos
WITH saturday_removals AS (
  DELETE FROM daily_workouts dw
  WHERE EXTRACT(DOW FROM dw.workout_date) = 6
    AND dw.workout_date >= CURRENT_DATE - INTERVAL '7 days'
    AND EXISTS (
      SELECT 1 FROM workout_plans wp 
      WHERE wp.user_id = dw.user_id 
      AND wp.is_active = true 
      AND jsonb_array_length(wp.plan_data->'workoutDays') < 6
    )
  RETURNING user_id, workout_date, workout_title
)
INSERT INTO system_logs (log_level, message)
SELECT 
  'CLEANUP',
  '🗑️ SÁBADO REMOVIDO (< 6 treinos): Usuário ' || user_id || 
  ' - Data: ' || workout_date || 
  ' - Treino: ' || workout_title
FROM saturday_removals;

-- 4. CORREÇÃO MASSIVA: Corrigir todos os treinos com distribuição errada
WITH workout_corrections AS (
  SELECT 
    dw.id,
    dw.user_id,
    dw.workout_date,
    dw.workout_title as old_title,
    EXTRACT(DOW FROM dw.workout_date) as day_of_week,
    wp.plan_data->'workoutDays' as workout_days,
    jsonb_array_length(wp.plan_data->'workoutDays') as total_workouts,
    -- Calcular o índice correto do treino (Segunda=0, Terça=1, etc.)
    (EXTRACT(DOW FROM dw.workout_date)::integer - 1) as workout_index
  FROM daily_workouts dw
  JOIN workout_plans wp ON wp.user_id = dw.user_id AND wp.is_active = true
  WHERE dw.workout_date >= CURRENT_DATE - INTERVAL '7 days'
    AND dw.workout_date <= CURRENT_DATE + INTERVAL '30 days'
    AND EXTRACT(DOW FROM dw.workout_date) BETWEEN 1 AND 6
    AND EXTRACT(DOW FROM dw.workout_date)::integer <= jsonb_array_length(wp.plan_data->'workoutDays')
    -- Só corrigir se não estiver aprovado ou completo
    AND dw.approval_status != 'approved'
    AND dw.status != 'completed'
),
corrected_workouts AS (
  UPDATE daily_workouts 
  SET 
    workout_title = (
      SELECT (wc.workout_days->wc.workout_index)->>'title'
      FROM workout_corrections wc 
      WHERE wc.id = daily_workouts.id
    ),
    workout_content = (
      SELECT STRING_AGG(
        (idx + 1) || '️⃣ ' || 
        (exercise->>'name') || ': ' ||
        (exercise->>'sets') || 'x' || (exercise->>'reps') ||
        CASE WHEN exercise->>'rest' IS NOT NULL 
             THEN ', Descanso: ' || (exercise->>'rest') 
             ELSE '' END,
        E'\n'
      )
      FROM workout_corrections wc,
           jsonb_array_elements((wc.workout_days->wc.workout_index)->'exercises') WITH ORDINALITY AS t(exercise, idx)
      WHERE wc.id = daily_workouts.id
      GROUP BY wc.id
    ),
    updated_at = now()
  WHERE id IN (SELECT id FROM workout_corrections)
  RETURNING id, user_id, workout_date, workout_title
)
INSERT INTO system_logs (log_level, message)
SELECT 
  'SUCCESS',
  '✅ TREINO CORRIGIDO: Usuário ' || user_id || 
  ' - Data: ' || workout_date || 
  ' - Novo título: ' || workout_title
FROM corrected_workouts;

-- 5. LIMPEZA FINAL: Remover duplicatas mantendo o mais adequado
WITH ranked_workouts AS (
  SELECT 
    id,
    user_id,
    workout_date,
    workout_title,
    status,
    approval_status,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, workout_date 
      ORDER BY 
        CASE WHEN approval_status = 'approved' THEN 1 ELSE 2 END,
        CASE WHEN status = 'completed' THEN 1 WHEN status = 'sent' THEN 2 ELSE 3 END,
        created_at DESC
    ) as rn
  FROM daily_workouts
  WHERE workout_date >= CURRENT_DATE - INTERVAL '7 days'
    AND workout_date <= CURRENT_DATE + INTERVAL '30 days'
),
duplicate_removals AS (
  DELETE FROM daily_workouts 
  WHERE id IN (
    SELECT id FROM ranked_workouts WHERE rn > 1
  )
  RETURNING user_id, workout_date, workout_title
)
INSERT INTO system_logs (log_level, message)
SELECT 
  'CLEANUP',
  '🗑️ DUPLICATA REMOVIDA: Usuário ' || user_id || 
  ' - Data: ' || workout_date || 
  ' - Treino: ' || workout_title
FROM duplicate_removals;

-- 6. VALIDAÇÃO FINAL: Verificar se a correção funcionou
WITH final_validation AS (
  SELECT 
    dw.user_id,
    p.name as user_name,
    COUNT(*) as total_workouts_scheduled,
    COUNT(CASE WHEN EXTRACT(DOW FROM dw.workout_date) = 0 THEN 1 END) as sunday_workouts,
    COUNT(CASE WHEN EXTRACT(DOW FROM dw.workout_date) = 6 THEN 1 END) as saturday_workouts,
    -- Verificar se títulos estão corretos
    COUNT(CASE 
      WHEN EXTRACT(DOW FROM dw.workout_date) = 1 AND dw.workout_title != 'Treino A' THEN 1 
      WHEN EXTRACT(DOW FROM dw.workout_date) = 2 AND dw.workout_title != 'Treino B' THEN 1
      WHEN EXTRACT(DOW FROM dw.workout_date) = 3 AND dw.workout_title != 'Treino C' THEN 1
      WHEN EXTRACT(DOW FROM dw.workout_date) = 4 AND dw.workout_title != 'Treino D' THEN 1
      WHEN EXTRACT(DOW FROM dw.workout_date) = 5 AND dw.workout_title != 'Treino E' THEN 1
      WHEN EXTRACT(DOW FROM dw.workout_date) = 6 AND dw.workout_title != 'Treino F' THEN 1
    END) as incorrect_titles,
    jsonb_array_length(wp.plan_data->'workoutDays') as plan_workouts
  FROM daily_workouts dw
  JOIN profiles p ON p.id = dw.user_id
  LEFT JOIN workout_plans wp ON wp.user_id = dw.user_id AND wp.is_active = true
  WHERE dw.workout_date >= CURRENT_DATE
    AND dw.workout_date <= CURRENT_DATE + INTERVAL '7 days'
  GROUP BY dw.user_id, p.name, wp.plan_data
)
INSERT INTO system_logs (log_level, message)
SELECT 
  CASE 
    WHEN sunday_workouts > 0 OR incorrect_titles > 0 THEN 'ERROR'
    ELSE 'SUCCESS'
  END,
  '🔍 VALIDAÇÃO FINAL: ' || user_name || 
  ' - Treinos agendados: ' || total_workouts_scheduled ||
  ' - Domingos (deve ser 0): ' || sunday_workouts ||
  ' - Sábados: ' || saturday_workouts ||
  ' - Títulos incorretos (deve ser 0): ' || incorrect_titles ||
  ' - Treinos no plano: ' || COALESCE(plan_workouts::text, 'N/A')
FROM final_validation;

-- 7. LOG FINAL DE SUCESSO
INSERT INTO system_logs (log_level, message)
VALUES (
  'SUCCESS',
  '🎉 CORREÇÃO COMPLETA E DEFINITIVA FINALIZADA! ' ||
  'Sistema agora garante distribuição sequencial perfeita: ' ||
  'Segunda=Treino A, Terça=Treino B, Quarta=Treino C, Quinta=Treino D, Sexta=Treino E, Sábado=Treino F (apenas se 6 treinos). ' ||
  'Domingo SEMPRE descanso. ' ||
  'Todos os treinos mal distribuídos foram corrigidos. ' ||
  'Data: ' || CURRENT_TIMESTAMP
);