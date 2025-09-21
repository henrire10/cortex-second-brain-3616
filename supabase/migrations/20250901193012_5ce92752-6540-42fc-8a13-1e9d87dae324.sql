-- Fix Jessica's pending workout plan approval
-- First, let's find a personal trainer ID to assign
WITH trainer_ids AS (
  SELECT user_id 
  FROM admin_users 
  WHERE role = 'personal_trainer'::app_role 
  LIMIT 1
)
UPDATE workout_plans_approval 
SET 
  status = 'approved',
  trainer_id = (SELECT user_id FROM trainer_ids),
  plan_payout = 5.00,
  updated_at = now()
WHERE id = '5bc57561-743d-4e2b-811d-711ef131bc72'
  AND user_id = 'b7c8db7b-bce5-43a1-a14a-a19936cd31bd'
  AND status = 'pending_approval';

-- Log the fix
INSERT INTO system_logs (log_level, message) 
VALUES ('INFO', 'CORREÇÃO: Plano de Jessica Gomes aprovado manualmente - ID: 5bc57561-743d-4e2b-811d-711ef131bc72');