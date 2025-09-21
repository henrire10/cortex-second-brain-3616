
-- Criar a view pending_workouts_with_profile para resolver o problema de perfil não encontrado
CREATE OR REPLACE VIEW public.pending_workouts_with_profile AS
SELECT 
    dw.id,
    dw.user_id,
    dw.workout_date,
    dw.workout_title,
    dw.workout_content,
    dw.approval_status,
    dw.created_at,
    dw.updated_at,
    dw.status,
    dw.personal_notes,
    dw.approved_by,
    dw.approved_at,
    dw.trainer_payout,
    dw.plan_id,
    dw.sent_at,
    dw.completed_at,
    dw.timezone,
    dw.total_estimated_calories,
    dw.user_completion_payment,
    -- Dados do perfil
    p.name as user_name,
    p.email as user_email,
    p.age,
    p.gender,
    p.height,
    p.weight,
    p.fitness_goal,
    p.experience_level,
    -- Dados do WhatsApp (se disponível)
    uw.phone_number
FROM public.daily_workouts dw
LEFT JOIN public.profiles p ON dw.user_id = p.id
LEFT JOIN public.user_whatsapp uw ON dw.user_id = uw.user_id
WHERE dw.approval_status = 'pending_approval'
ORDER BY dw.created_at ASC;

-- Adicionar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_daily_workouts_approval_status ON public.daily_workouts(approval_status);
CREATE INDEX IF NOT EXISTS idx_daily_workouts_user_id ON public.daily_workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);
