
-- 1. Criar nova tabela workout_plans para planos de treino
CREATE TABLE public.workout_plans_approval (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  trainer_id uuid REFERENCES public.profiles(id),
  start_date timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending_approval',
  plan_payout numeric DEFAULT 0,
  plan_data jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT workout_plans_approval_status_check 
  CHECK (status IN ('pending_approval', 'approved', 'rejected'))
);

-- 2. Adicionar coluna plan_id na tabela daily_workouts
ALTER TABLE public.daily_workouts 
ADD COLUMN plan_id uuid REFERENCES public.workout_plans_approval(id);

-- 3. Habilitar RLS na nova tabela
ALTER TABLE public.workout_plans_approval ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas RLS para workout_plans_approval
CREATE POLICY "Users can view their own workout plans approval"
  ON public.workout_plans_approval
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workout plans approval"
  ON public.workout_plans_approval
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Personal trainers can view all pending workout plans"
  ON public.workout_plans_approval
  FOR SELECT
  USING (is_personal_trainer() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Personal trainers can update workout plans approval"
  ON public.workout_plans_approval
  FOR UPDATE
  USING (is_personal_trainer() OR has_role(auth.uid(), 'admin'::app_role));

-- 5. Criar função para aprovar plano completo
CREATE OR REPLACE FUNCTION public.approve_workout_plan(
  p_plan_id uuid,
  p_trainer_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  plan_record RECORD;
  trainer_rate NUMERIC;
  affected_workouts INTEGER;
BEGIN
  -- Buscar dados do plano
  SELECT * INTO plan_record
  FROM workout_plans_approval
  WHERE id = p_plan_id
  AND status = 'pending_approval';
  
  IF plan_record IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Plano não encontrado ou já processado'
    );
  END IF;
  
  -- Buscar taxa do personal trainer
  SELECT payout_rate_per_review INTO trainer_rate
  FROM profiles
  WHERE id = p_trainer_id;
  
  IF trainer_rate IS NULL THEN
    trainer_rate := 5.00; -- Taxa padrão
  END IF;
  
  -- Atualizar plano para aprovado
  UPDATE workout_plans_approval
  SET 
    status = 'approved',
    trainer_id = p_trainer_id,
    plan_payout = trainer_rate,
    updated_at = now()
  WHERE id = p_plan_id;
  
  -- Atualizar todos os daily_workouts relacionados
  UPDATE daily_workouts
  SET 
    status = 'sent',
    approved_by = p_trainer_id,
    approved_at = now(),
    approval_status = 'approved'
  WHERE plan_id = p_plan_id;
  
  GET DIAGNOSTICS affected_workouts = ROW_COUNT;
  
  RETURN json_build_object(
    'success', true,
    'plan_payout', trainer_rate,
    'workouts_updated', affected_workouts,
    'message', 'Plano aprovado com sucesso'
  );
END;
$$;
