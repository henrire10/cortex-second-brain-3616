-- Criar treinos para Jessica para a semana atual
-- Primeiro, buscar o plano aprovado da Jessica
WITH jessica_plan AS (
  SELECT * FROM workout_plans_approval 
  WHERE user_id = 'b7c8db7b-bce5-43a1-a14a-a19936cd31bd'
  AND status = 'approved'
  ORDER BY created_at DESC
  LIMIT 1
),
trainer_info AS (
  SELECT user_id as trainer_id FROM admin_users 
  WHERE role = 'personal_trainer'::app_role 
  LIMIT 1
)
-- Criar treinos para a semana (Segunda, Quarta, Sexta - 3x por semana)
INSERT INTO daily_workouts (
  user_id,
  workout_date,
  workout_title,
  workout_content,
  status,
  approval_status,
  approved_by,
  approved_at,
  plan_id,
  trainer_payout
)
SELECT 
  'b7c8db7b-bce5-43a1-a14a-a19936cd31bd' as user_id,
  workout_date,
  'Treino ' || workout_letter || ' - ' || workout_title as workout_title,
  workout_content,
  'sent' as status,
  'approved' as approval_status,
  (SELECT trainer_id FROM trainer_info) as approved_by,
  now() as approved_at,
  (SELECT id FROM jessica_plan) as plan_id,
  0 as trainer_payout
FROM (
  VALUES 
    ('2025-01-06'::date, 'A', 'Treino Superior', '1️⃣ Supino com halteres: 3x12, Descanso: 1 min
2️⃣ Remada curvada: 3x12, Descanso: 1 min  
3️⃣ Desenvolvimento com halteres: 3x10, Descanso: 1 min
4️⃣ Rosca bíceps: 3x12, Descanso: 45s
5️⃣ Tríceps pulley: 3x12, Descanso: 45s'),
    ('2025-01-08'::date, 'B', 'Treino Inferior', '1️⃣ Agachamento livre: 3x15, Descanso: 1 min
2️⃣ Afundo alternado: 3x12 cada perna, Descanso: 1 min
3️⃣ Leg press: 3x15, Descanso: 1 min
4️⃣ Panturrilha em pé: 3x15, Descanso: 45s
5️⃣ Glúteo no cabo: 3x12 cada perna, Descanso: 45s'),
    ('2025-01-10'::date, 'C', 'Treino Funcional', '1️⃣ Burpees: 3x8, Descanso: 1 min
2️⃣ Mountain climbers: 3x20, Descanso: 45s
3️⃣ Prancha abdominal: 3x30s, Descanso: 45s
4️⃣ Jumping jacks: 3x20, Descanso: 45s
5️⃣ Flexão de braço: 3x10, Descanso: 1 min')
) AS workouts(workout_date, workout_letter, workout_title, workout_content)
WHERE NOT EXISTS (
  SELECT 1 FROM daily_workouts 
  WHERE user_id = 'b7c8db7b-bce5-43a1-a14a-a19936cd31bd' 
  AND workout_date = workouts.workout_date
);

-- Log da criação
INSERT INTO system_logs (log_level, message) 
VALUES ('SUCCESS', '✅ TREINOS CRIADOS: Jessica Gomes - 3 treinos programados para a semana (06/01, 08/01, 10/01)');

-- Verificar se foram criados
SELECT 
  workout_date,
  workout_title,
  status,
  approval_status
FROM daily_workouts 
WHERE user_id = 'b7c8db7b-bce5-43a1-a14a-a19936cd31bd'
AND workout_date >= '2025-01-06'
AND workout_date <= '2025-01-12'
ORDER BY workout_date;