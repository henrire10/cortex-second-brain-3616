-- Migração para corrigir dados órfãos e criar planos de aprovação retroativos

-- 1. Primeiro, criar planos de aprovação para workout_plans que não têm um
INSERT INTO workout_plans_approval (user_id, plan_data, status, created_at)
SELECT 
  wp.user_id,
  wp.plan_data,
  'pending_approval' as status,
  wp.created_at
FROM workout_plans wp
WHERE wp.is_active = true 
AND NOT EXISTS (
  SELECT 1 FROM workout_plans_approval wpa 
  WHERE wpa.user_id = wp.user_id 
  AND wpa.created_at::date = wp.created_at::date
);

-- 2. Atualizar daily_workouts órfãos para associá-los aos planos de aprovação
UPDATE daily_workouts 
SET plan_id = (
  SELECT wpa.id 
  FROM workout_plans_approval wpa 
  WHERE wpa.user_id = daily_workouts.user_id 
  AND wpa.status = 'pending_approval'
  ORDER BY wpa.created_at DESC 
  LIMIT 1
)
WHERE plan_id IS NULL 
AND approval_status = 'pending_approval';

-- 3. Logs para verificar a migração
INSERT INTO system_logs (log_level, message) 
VALUES ('INFO', 'Migração de dados órfãos concluída - planos de aprovação criados e daily_workouts associados');

-- 4. Verificar se ainda há dados órfãos
INSERT INTO system_logs (log_level, message, created_at) 
SELECT 
  'WARN' as log_level,
  'Daily workouts órfãos encontrados: ' || COUNT(*) as message,
  now() as created_at
FROM daily_workouts 
WHERE plan_id IS NULL 
AND approval_status = 'pending_approval'
HAVING COUNT(*) > 0;