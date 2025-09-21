
-- Recriar a view workouts_pending_approval com JOINs corretos
DROP VIEW IF EXISTS public.workouts_pending_approval;

CREATE OR REPLACE VIEW public.workouts_pending_approval AS
SELECT 
    dw.id,
    dw.user_id,
    dw.workout_date,
    dw.workout_title,
    dw.workout_content,
    dw.approval_status,
    p.name as user_name,
    p.email as user_email,
    p.fitness_goal,
    p.age,
    p.gender,
    p.experience_level,
    COALESCE(uw.phone_number, 'Não cadastrado') as phone_number
FROM public.daily_workouts dw
JOIN public.profiles p ON dw.user_id = p.id
LEFT JOIN public.user_whatsapp uw ON dw.user_id = uw.user_id
WHERE dw.approval_status = 'pending_approval'
ORDER BY dw.created_at ASC;

-- Adicionar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_daily_workouts_approval_status ON public.daily_workouts(approval_status);
CREATE INDEX IF NOT EXISTS idx_daily_workouts_user_id ON public.daily_workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_whatsapp_user_id ON public.user_whatsapp(user_id);
