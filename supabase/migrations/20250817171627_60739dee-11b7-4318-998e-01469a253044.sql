-- Global fix: revert inconsistent auto-approvals and enforce integrity
BEGIN;

-- 1) Reverter treinos "aprovados" sem aprovador para pendente de aprovação
UPDATE public.daily_workouts
SET
  approval_status = 'pending_approval',
  status = 'pending',
  approved_by = NULL,
  approved_at = NULL,
  trainer_payout = 0,
  updated_at = now()
WHERE approval_status = 'approved'
  AND approved_by IS NULL;

-- 2) Trigger de integridade: impedir estado aprovado sem aprovador
CREATE OR REPLACE FUNCTION public.enforce_workout_approval_integrity()
RETURNS trigger AS $$
BEGIN
  -- Se marcado como aprovado, precisa ter approved_by e approved_at
  IF NEW.approval_status = 'approved' THEN
    IF NEW.approved_by IS NULL THEN
      RAISE EXCEPTION 'Invalid state: approved workout must have approved_by';
    END IF;
    IF NEW.approved_at IS NULL THEN
      NEW.approved_at = now();
    END IF;
  ELSE
    -- Para estados não aprovados, garantir consistência
    IF NEW.approval_status IS NULL THEN
      NEW.approval_status := 'pending_approval';
    END IF;
    IF NEW.approval_status <> 'approved' THEN
      NEW.approved_by := NULL;
      NEW.approved_at := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_workout_approval_integrity ON public.daily_workouts;
CREATE TRIGGER trg_enforce_workout_approval_integrity
BEFORE INSERT OR UPDATE ON public.daily_workouts
FOR EACH ROW
EXECUTE FUNCTION public.enforce_workout_approval_integrity();

-- 3) Logar execução
INSERT INTO public.system_logs (log_level, message)
VALUES ('INFO', 'GLOBAL FIX: Reverted inconsistent approvals and added integrity trigger for daily_workouts');

COMMIT;