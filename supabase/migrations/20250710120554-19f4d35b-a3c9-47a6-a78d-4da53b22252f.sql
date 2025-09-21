
-- Adicionar campo para controlar duração do plano de treino
ALTER TABLE public.workout_plans 
ADD COLUMN plan_duration_days INTEGER DEFAULT 30,
ADD COLUMN plan_start_date DATE DEFAULT CURRENT_DATE;

-- Atualizar planos existentes
UPDATE public.workout_plans 
SET plan_start_date = created_at::DATE 
WHERE plan_start_date IS NULL;

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.workout_plans.plan_duration_days IS 'Duração do plano em dias (padrão 30 dias)';
COMMENT ON COLUMN public.workout_plans.plan_start_date IS 'Data de início do plano para cálculo dos 30 dias';
