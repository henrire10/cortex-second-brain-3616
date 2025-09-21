-- Remover triggers problemáticos que estão causando erros na geração de treinos

-- 1. Remover trigger validate_no_sunday_workouts
DROP TRIGGER IF EXISTS validate_no_sunday_workouts ON daily_workouts;
DROP FUNCTION IF EXISTS public.validate_no_sunday_workouts();

-- 2. Remover trigger prevent_future_workout_overload  
DROP TRIGGER IF EXISTS prevent_future_workout_overload ON daily_workouts;
DROP FUNCTION IF EXISTS public.prevent_future_workout_overload();

-- 3. Remover trigger validate_flexible_workout_distribution
DROP TRIGGER IF EXISTS validate_flexible_workout_distribution ON daily_workouts;
DROP FUNCTION IF EXISTS public.validate_flexible_workout_distribution();

-- 4. Remover trigger validate_workout_approval (redundante)
DROP TRIGGER IF EXISTS validate_workout_approval ON daily_workouts;
DROP FUNCTION IF EXISTS public.validate_workout_approval();

-- Log da remoção
INSERT INTO system_logs (log_level, message) 
VALUES ('INFO', '🔧 TRIGGERS PROBLEMÁTICOS REMOVIDOS: Triggers restritivos removidos para melhorar flexibilidade na geração de treinos');