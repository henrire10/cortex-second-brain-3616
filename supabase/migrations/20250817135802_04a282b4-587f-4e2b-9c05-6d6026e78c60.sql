
-- Corrigir a view para não perder linhas por causa do RLS em profiles
-- e facilitar o debug no painel (inclui created_at, updated_at, status e plan_id)

CREATE OR REPLACE VIEW public.workouts_pending_approval AS
SELECT
  dw.id,
  dw.user_id,
  dw.workout_date,
  dw.workout_title,
  dw.workout_content,
  dw.status,
  dw.approval_status,
  dw.plan_id,
  dw.created_at,
  dw.updated_at,
  COALESCE(p.name, '—') AS user_name,
  COALESCE(p.email, '—') AS user_email,
  p.fitness_goal,
  p.age,
  p.gender,
  p.height,
  p.weight,
  p.experience_level,
  COALESCE(uw.phone_number, 'Não cadastrado') AS phone_number
FROM public.daily_workouts dw
LEFT JOIN public.profiles p
  ON dw.user_id = p.id
LEFT JOIN public.user_whatsapp uw
  ON dw.user_id = uw.user_id
WHERE dw.approval_status = 'pending_approval'
ORDER BY dw.created_at DESC;
