-- Adicionar coluna workout_date na tabela workout_logs
ALTER TABLE public.workout_logs 
ADD COLUMN workout_date DATE;

-- Migrar dados existentes: usar a data de logged_at como workout_date inicial
UPDATE public.workout_logs 
SET workout_date = logged_at::DATE 
WHERE workout_date IS NULL;

-- Tornar a coluna obrigatória após migração
ALTER TABLE public.workout_logs 
ALTER COLUMN workout_date SET NOT NULL;

-- Remover duplicatas mantendo apenas o registro mais recente
DELETE FROM public.workout_logs 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, exercise_name, set_number, workout_date) id
  FROM public.workout_logs 
  ORDER BY user_id, exercise_name, set_number, workout_date, logged_at DESC
);

-- Criar índice único composto para evitar duplicações por data
CREATE UNIQUE INDEX idx_workout_logs_unique_per_date 
ON public.workout_logs (user_id, exercise_name, set_number, workout_date);

-- Adicionar comentário para documentação
COMMENT ON COLUMN public.workout_logs.workout_date IS 'Data real do treino (independente de quando foi registrado)';