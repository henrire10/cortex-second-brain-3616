-- 🚀 CORREÇÃO COMPLETA: Auditoria e limpeza da distribuição de treinos
-- Data: 2025-01-30
-- Objetivo: Corrigir duplicações e distribuições incorretas preservando funcionalidade

-- 1. AUDITORIA: Identificar treinos duplicados por data
WITH duplicate_workouts AS (
  SELECT 
    user_id,
    workout_date,
    COUNT(*) as workout_count,
    STRING_AGG(workout_title, ', ') as titles,
    STRING_AGG(id::text, ', ') as workout_ids
  FROM daily_workouts 
  WHERE workout_date >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY user_id, workout_date
  HAVING COUNT(*) > 1
)
INSERT INTO system_logs (log_level, message)
SELECT 
  'AUDIT',
  '🔍 DUPLICAÇÃO DETECTADA: Usuário ' || user_id || 
  ', Data: ' || workout_date || 
  ', Quantidade: ' || workout_count || 
  ', Treinos: [' || titles || ']'
FROM duplicate_workouts;

-- 2. AUDITORIA: Verificar distribuição correta por dia da semana
WITH workout_analysis AS (
  SELECT 
    dw.user_id,
    dw.workout_date,
    EXTRACT(DOW FROM dw.workout_date) as day_of_week,
    dw.workout_title,
    dw.id,
    p.name as user_name,
    wp.plan_data->'workoutDays' as workout_days,
    jsonb_array_length(wp.plan_data->'workoutDays') as total_workouts
  FROM daily_workouts dw
  JOIN profiles p ON p.id = dw.user_id
  LEFT JOIN workout_plans wp ON wp.user_id = dw.user_id AND wp.is_active = true
  WHERE dw.workout_date >= CURRENT_DATE - INTERVAL '15 days'
    AND dw.workout_date <= CURRENT_DATE + INTERVAL '15 days'
),
incorrect_distributions AS (
  SELECT 
    user_id,
    user_name,
    workout_date,
    day_of_week,
    workout_title,
    total_workouts,
    CASE 
      WHEN day_of_week = 0 THEN 'ERRO: Domingo com treino'
      WHEN day_of_week = 6 AND total_workouts < 6 THEN 'ERRO: Sábado com treino (deveria ser descanso)'
      WHEN day_of_week > total_workouts THEN 'ERRO: Dia excede número de treinos definidos'
      ELSE 'OK'
    END as status_check
  FROM workout_analysis
  WHERE total_workouts IS NOT NULL
)
INSERT INTO system_logs (log_level, message)
SELECT 
  'AUDIT',
  '🚨 DISTRIBUIÇÃO INCORRETA: ' || user_name || 
  ' - ' || workout_date || 
  ' (' || CASE day_of_week WHEN 0 THEN 'DOM' WHEN 1 THEN 'SEG' WHEN 2 THEN 'TER' 
             WHEN 3 THEN 'QUA' WHEN 4 THEN 'QUI' WHEN 5 THEN 'SEX' WHEN 6 THEN 'SAB' END || 
  ') - ' || status_check || 
  ' - Treino: ' || workout_title
FROM incorrect_distributions 
WHERE status_check != 'OK';

-- 3. LIMPEZA: Remover treinos de domingo (NUNCA deveria existir)
WITH sunday_workouts AS (
  DELETE FROM daily_workouts 
  WHERE EXTRACT(DOW FROM workout_date) = 0
    AND workout_date >= CURRENT_DATE - INTERVAL '30 days'
  RETURNING user_id, workout_date, workout_title
)
INSERT INTO system_logs (log_level, message)
SELECT 
  'CLEANUP',
  '🗑️ REMOVIDO: Treino de domingo para usuário ' || user_id || 
  ' - Data: ' || workout_date || 
  ' - Treino: ' || workout_title
FROM sunday_workouts;

-- 4. LIMPEZA: Manter apenas o treino mais recente em caso de duplicação
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
  WHERE workout_date >= CURRENT_DATE - INTERVAL '30 days'
),
duplicates_to_remove AS (
  DELETE FROM daily_workouts 
  WHERE id IN (
    SELECT id FROM ranked_workouts WHERE rn > 1
  )
  RETURNING user_id, workout_date, workout_title
)
INSERT INTO system_logs (log_level, message)
SELECT 
  'CLEANUP',
  '🗑️ DUPLICAÇÃO REMOVIDA: Usuário ' || user_id || 
  ' - Data: ' || workout_date || 
  ' - Treino: ' || workout_title
FROM duplicates_to_remove;

-- 5. CORREÇÃO: Atualizar treinos futuros com distribuição correta
WITH future_corrections AS (
  SELECT 
    dw.id,
    dw.user_id,
    dw.workout_date,
    EXTRACT(DOW FROM dw.workout_date) as day_of_week,
    wp.plan_data->'workoutDays' as workout_days,
    jsonb_array_length(wp.plan_data->'workoutDays') as total_workouts,
    (wp.plan_data->'workoutDays'->((EXTRACT(DOW FROM dw.workout_date)::integer - 1)))
  FROM daily_workouts dw
  JOIN workout_plans wp ON wp.user_id = dw.user_id AND wp.is_active = true
  WHERE dw.workout_date > CURRENT_DATE
    AND dw.approval_status = 'pending_approval'
    AND EXTRACT(DOW FROM dw.workout_date) BETWEEN 1 AND 6
    AND EXTRACT(DOW FROM dw.workout_date) <= jsonb_array_length(wp.plan_data->'workoutDays')
)
UPDATE daily_workouts 
SET 
  workout_title = (
    SELECT (fc.workout_days->((fc.day_of_week - 1)))->>'title'
    FROM future_corrections fc 
    WHERE fc.id = daily_workouts.id
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
    FROM future_corrections fc,
         jsonb_array_elements((fc.workout_days->((fc.day_of_week - 1)))->'exercises') WITH ORDINALITY AS t(exercise, idx)
    WHERE fc.id = daily_workouts.id
    GROUP BY fc.id
  ),
  updated_at = now()
WHERE id IN (SELECT id FROM future_corrections);

-- 6. LOG FINAL: Resumo da correção
INSERT INTO system_logs (log_level, message)
VALUES (
  'SUCCESS',
  '✅ CORREÇÃO COMPLETA FINALIZADA: ' ||
  'Auditoria executada, duplicações removidas, distribuições corrigidas. ' ||
  'Sistema agora segue distribuição sequencial: Segunda=A, Terça=B, Quarta=C, Quinta=D, Sexta=E, Sábado=F (se 6 treinos). ' ||
  'Domingo sempre descanso. Data: ' || CURRENT_TIMESTAMP
);

-- 7. TRIGGER de segurança para prevenir treinos de domingo no futuro
DROP TRIGGER IF EXISTS prevent_sunday_workouts ON daily_workouts;
CREATE TRIGGER prevent_sunday_workouts
  BEFORE INSERT OR UPDATE ON daily_workouts
  FOR EACH ROW
  EXECUTE FUNCTION validate_no_sunday_workouts();