-- Remover triggers problemáticos usando CASCADE para resolver dependências

-- 1. Remover todos os triggers relacionados a validação de domingo
DROP TRIGGER IF EXISTS validate_no_sunday_workouts ON daily_workouts CASCADE;
DROP TRIGGER IF EXISTS prevent_sunday_workouts ON daily_workouts CASCADE;
DROP FUNCTION IF EXISTS public.validate_no_sunday_workouts() CASCADE;

-- 2. Remover trigger prevent_future_workout_overload  
DROP TRIGGER IF EXISTS prevent_future_workout_overload ON daily_workouts CASCADE;
DROP FUNCTION IF EXISTS public.prevent_future_workout_overload() CASCADE;

-- 3. Remover trigger validate_flexible_workout_distribution
DROP TRIGGER IF EXISTS validate_flexible_workout_distribution ON daily_workouts CASCADE;
DROP FUNCTION IF EXISTS public.validate_flexible_workout_distribution() CASCADE;

-- 4. Remover trigger validate_workout_approval (redundante)
DROP TRIGGER IF EXISTS validate_workout_approval ON daily_workouts CASCADE;
DROP FUNCTION IF EXISTS public.validate_workout_approval() CASCADE;

-- Log da remoção
INSERT INTO system_logs (log_level, message) 
VALUES ('SUCCESS', '✅ TRIGGERS PROBLEMÁTICOS REMOVIDOS: Sistema de geração de treinos liberado de validações restritivas');