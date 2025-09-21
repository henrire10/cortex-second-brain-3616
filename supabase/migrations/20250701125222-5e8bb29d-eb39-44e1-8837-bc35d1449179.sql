
-- Adicionar coluna para controlar pagamento por usuário
ALTER TABLE daily_workouts ADD COLUMN user_completion_payment NUMERIC DEFAULT 0;

-- Adicionar índice para melhorar performance das consultas
CREATE INDEX IF NOT EXISTS idx_daily_workouts_user_completion 
ON daily_workouts(user_id, approval_status, user_completion_payment);

-- Função para calcular se todos os treinos do usuário estão aprovados
CREATE OR REPLACE FUNCTION check_user_workouts_completed(p_user_id UUID, p_date_range INTEGER DEFAULT 30)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_workouts INTEGER;
  approved_workouts INTEGER;
BEGIN
  -- Contar total de treinos dos últimos X dias
  SELECT COUNT(*) INTO total_workouts
  FROM daily_workouts
  WHERE user_id = p_user_id
  AND workout_date >= CURRENT_DATE - INTERVAL '1 day' * p_date_range;
  
  -- Contar treinos aprovados
  SELECT COUNT(*) INTO approved_workouts
  FROM daily_workouts
  WHERE user_id = p_user_id
  AND approval_status = 'approved'
  AND workout_date >= CURRENT_DATE - INTERVAL '1 day' * p_date_range;
  
  -- Retornar true se todos os treinos estão aprovados e há pelo menos 1 treino
  RETURN (total_workouts > 0 AND total_workouts = approved_workouts);
END;
$$;

-- Função para processar pagamento quando usuário completa todos os treinos
CREATE OR REPLACE FUNCTION process_user_completion_payment(p_user_id UUID, p_trainer_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  trainer_rate NUMERIC;
  workouts_count INTEGER;
  already_paid BOOLEAN := FALSE;
  result_json JSONB;
BEGIN
  -- Buscar taxa do personal trainer
  SELECT payout_rate_per_review INTO trainer_rate
  FROM profiles
  WHERE id = p_trainer_id;
  
  -- Verificar se já foi pago
  SELECT EXISTS(
    SELECT 1 FROM daily_workouts
    WHERE user_id = p_user_id
    AND approved_by = p_trainer_id
    AND user_completion_payment > 0
    LIMIT 1
  ) INTO already_paid;
  
  IF already_paid THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Usuário já foi pago anteriormente'
    );
  END IF;
  
  -- Verificar se todos os treinos estão aprovados
  IF NOT check_user_workouts_completed(p_user_id) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Nem todos os treinos do usuário estão aprovados'
    );
  END IF;
  
  -- Contar treinos aprovados pelo trainer
  SELECT COUNT(*) INTO workouts_count
  FROM daily_workouts
  WHERE user_id = p_user_id
  AND approved_by = p_trainer_id
  AND approval_status = 'approved';
  
  -- Marcar um treino com o pagamento (representando o pagamento pelo usuário completo)
  UPDATE daily_workouts
  SET user_completion_payment = trainer_rate,
      trainer_payout = 0  -- Zerar pagamentos individuais
  WHERE user_id = p_user_id
  AND approved_by = p_trainer_id
  AND approval_status = 'approved'
  AND id = (
    SELECT id FROM daily_workouts
    WHERE user_id = p_user_id
    AND approved_by = p_trainer_id
    AND approval_status = 'approved'
    ORDER BY approved_at DESC
    LIMIT 1
  );
  
  RETURN json_build_object(
    'success', true,
    'payment_amount', trainer_rate,
    'workouts_approved', workouts_count,
    'message', 'Pagamento processado com sucesso'
  );
END;
$$;
