BEGIN;

-- Função: aprovar plano automaticamente quando todos os treinos forem aprovados
CREATE OR REPLACE FUNCTION public.auto_approve_plan_when_all_workouts_approved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_count integer;
  approved_count integer;
  plan_status text;
  v_trainer uuid;
BEGIN
  -- Apenas quando um treino é aprovado e pertence a um plano
  IF TG_OP = 'UPDATE' AND NEW.approval_status = 'approved' AND NEW.plan_id IS NOT NULL THEN

    -- Se o plano já estiver aprovado, não faz nada
    SELECT status INTO plan_status
    FROM public.workout_plans_approval
    WHERE id = NEW.plan_id;

    IF plan_status = 'approved' THEN
      RETURN NEW;
    END IF;

    -- Contar treinos do plano
    SELECT COUNT(*) INTO total_count
    FROM public.daily_workouts
    WHERE plan_id = NEW.plan_id;

    SELECT COUNT(*) INTO approved_count
    FROM public.daily_workouts
    WHERE plan_id = NEW.plan_id
      AND approval_status = 'approved';

    -- Quando todos estiverem aprovados, aprovar plano e expandir
    IF total_count > 0 AND total_count = approved_count THEN
      -- Resolver trainer
      SELECT COALESCE(
        NEW.approved_by,
        (SELECT approved_by FROM public.daily_workouts 
          WHERE plan_id = NEW.plan_id AND approved_by IS NOT NULL 
          ORDER BY approved_at DESC NULLS LAST LIMIT 1),
        (SELECT trainer_id FROM public.workout_plans_approval WHERE id = NEW.plan_id)
      ) INTO v_trainer;

      IF v_trainer IS NULL THEN
        -- Se ainda nulo, logar e sair
        INSERT INTO public.system_logs (log_level, message)
        VALUES ('ERROR', 'AUTO-APPROVAL: trainer_id não encontrado para plano ' || NEW.plan_id || '. Pulando aprovação automática do plano.');
        RETURN NEW;
      END IF;

      PERFORM public.approve_workout_plan_with_future_workouts(NEW.plan_id, v_trainer);

      INSERT INTO public.system_logs (log_level, message)
      VALUES ('SUCCESS', 'AUTO-APPROVAL: Plano ' || NEW.plan_id || ' aprovado automaticamente após todos os treinos aprovados. Trainer: ' || v_trainer);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger
DROP TRIGGER IF EXISTS trg_auto_approve_plan_when_all_workouts_approved ON public.daily_workouts;
CREATE TRIGGER trg_auto_approve_plan_when_all_workouts_approved
AFTER UPDATE OF approval_status ON public.daily_workouts
FOR EACH ROW
EXECUTE FUNCTION public.auto_approve_plan_when_all_workouts_approved();

-- Backfill: aprovar qualquer plano onde todos os treinos já estão aprovados
DO $$
DECLARE
  rec RECORD;
  v_trainer uuid;
BEGIN
  FOR rec IN
    SELECT wpa.id as plan_id
    FROM public.workout_plans_approval wpa
    WHERE wpa.status = 'pending_approval'
      AND EXISTS (SELECT 1 FROM public.daily_workouts dw WHERE dw.plan_id = wpa.id)
      AND NOT EXISTS (SELECT 1 FROM public.daily_workouts dw WHERE dw.plan_id = wpa.id AND dw.approval_status <> 'approved')
  LOOP
    SELECT approved_by INTO v_trainer
    FROM public.daily_workouts
    WHERE plan_id = rec.plan_id AND approved_by IS NOT NULL
    ORDER BY approved_at DESC NULLS LAST
    LIMIT 1;

    IF v_trainer IS NULL THEN
      -- Tentar trainer do plano se presente
      SELECT trainer_id INTO v_trainer
      FROM public.workout_plans_approval
      WHERE id = rec.plan_id;
    END IF;

    IF v_trainer IS NOT NULL THEN
      PERFORM public.approve_workout_plan_with_future_workouts(rec.plan_id, v_trainer);

      INSERT INTO public.system_logs (log_level, message)
      VALUES ('SUCCESS', 'BACKFILL AUTO-APPROVAL: Plano ' || rec.plan_id || ' aprovado automaticamente ao detectar todos os treinos aprovados. Trainer: ' || v_trainer);
    ELSE
      INSERT INTO public.system_logs (log_level, message)
      VALUES ('ERROR', 'BACKFILL AUTO-APPROVAL: Não foi possível resolver trainer para plano ' || rec.plan_id || '. Pulando.');
    END IF;
  END LOOP;
END;
$$;

COMMIT;