
-- Adicionar coluna para remuneração por treino aprovado
ALTER TABLE daily_workouts 
ADD COLUMN trainer_payout DECIMAL(10,2) DEFAULT 0;

-- Adicionar coluna para taxa de pagamento por avaliação na tabela profiles
ALTER TABLE profiles 
ADD COLUMN payout_rate_per_review DECIMAL(10,2) DEFAULT 5.00;

-- Comentários para documentação
COMMENT ON COLUMN daily_workouts.trainer_payout IS 'Valor pago ao personal trainer por revisar este treino específico';
COMMENT ON COLUMN profiles.payout_rate_per_review IS 'Taxa que o personal trainer recebe por cada avaliação de treino (apenas para personal trainers)';
