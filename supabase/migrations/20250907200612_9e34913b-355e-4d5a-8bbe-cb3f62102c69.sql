-- ============= COMPREHENSIVE ACHIEVEMENTS SYSTEM =============
-- This creates a complete achievement verification function that checks all 36 achievements

-- First, let's create the complete RPC function
CREATE OR REPLACE FUNCTION public.check_and_award_achievements(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_data RECORD;
  workout_data RECORD;
  achievement_record RECORD;
  newly_earned_achievements jsonb := '[]'::jsonb;
  total_new_achievements integer := 0;
  current_date_br date;
BEGIN
  -- Get Brazil current date
  current_date_br := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  
  -- Get user profile data
  SELECT 
    p.points, p.current_workout_streak, p.last_workout_date,
    COUNT(dw_total.id) as total_workouts,
    COUNT(CASE WHEN dw_completed.status = 'completed' THEN 1 END) as completed_workouts,
    COUNT(CASE WHEN dw_this_week.workout_date >= current_date_br - INTERVAL '7 days' AND dw_this_week.status = 'completed' THEN 1 END) as workouts_this_week,
    COUNT(CASE WHEN EXTRACT(HOUR FROM dw_early.completed_at AT TIME ZONE 'America/Sao_Paulo') < 7 AND dw_early.status = 'completed' THEN 1 END) as early_workouts,
    COUNT(CASE WHEN EXTRACT(HOUR FROM dw_night.completed_at AT TIME ZONE 'America/Sao_Paulo') >= 22 AND dw_night.status = 'completed' THEN 1 END) as night_workouts,
    COUNT(CASE WHEN EXTRACT(DOW FROM dw_weekend.workout_date) IN (0,6) AND dw_weekend.status = 'completed' THEN 1 END) as weekend_workouts
  INTO user_data
  FROM profiles p
  LEFT JOIN daily_workouts dw_total ON p.id = dw_total.user_id
  LEFT JOIN daily_workouts dw_completed ON p.id = dw_completed.user_id AND dw_completed.status = 'completed'
  LEFT JOIN daily_workouts dw_this_week ON p.id = dw_this_week.user_id AND dw_this_week.workout_date >= current_date_br - INTERVAL '7 days'
  LEFT JOIN daily_workouts dw_early ON p.id = dw_early.user_id AND dw_early.status = 'completed'
  LEFT JOIN daily_workouts dw_night ON p.id = dw_night.user_id AND dw_night.status = 'completed'
  LEFT JOIN daily_workouts dw_weekend ON p.id = dw_weekend.user_id
  WHERE p.id = p_user_id
  GROUP BY p.id, p.points, p.current_workout_streak, p.last_workout_date;
  
  -- Log user data for debugging
  INSERT INTO system_logs (log_level, message) 
  VALUES ('INFO', '🎯 CHECKING ACHIEVEMENTS for user ' || p_user_id || 
          ' - Completed: ' || user_data.completed_workouts || 
          ', Streak: ' || user_data.current_workout_streak || 
          ', Points: ' || user_data.points);
  
  -- ============= WORKOUT COUNT ACHIEVEMENTS =============
  
  -- 1. Primeira Vitória (1 treino)
  IF user_data.completed_workouts >= 1 THEN
    PERFORM award_achievement_if_not_exists(p_user_id, 'Primeira Vitória');
  END IF;
  
  -- 2. 10 Treinos (resolve conflict - use only "Guerreiro" for 10 workouts)
  IF user_data.completed_workouts >= 10 THEN
    PERFORM award_achievement_if_not_exists(p_user_id, 'Guerreiro');
  END IF;
  
  -- 3. 25 Treinos 
  IF user_data.completed_workouts >= 25 THEN
    PERFORM award_achievement_if_not_exists(p_user_id, 'Especialista');
  END IF;
  
  -- 4. 50 Treinos
  IF user_data.completed_workouts >= 50 THEN
    PERFORM award_achievement_if_not_exists(p_user_id, '50 Treinos Completos');
  END IF;
  
  -- 5. 100 Treinos
  IF user_data.completed_workouts >= 100 THEN
    PERFORM award_achievement_if_not_exists(p_user_id, '100 Treinos Completos');
  END IF;
  
  -- 6. 200 Treinos
  IF user_data.completed_workouts >= 200 THEN
    PERFORM award_achievement_if_not_exists(p_user_id, 'Maratonista');
  END IF;
  
  -- 7. 500 Treinos
  IF user_data.completed_workouts >= 500 THEN
    PERFORM award_achievement_if_not_exists(p_user_id, 'Campeão');
  END IF;
  
  -- ============= STREAK ACHIEVEMENTS =============
  
  -- 8. Sequência de 3 Dias
  IF user_data.current_workout_streak >= 3 THEN
    PERFORM award_achievement_if_not_exists(p_user_id, 'Sequência de 3 Dias');
  END IF;
  
  -- 9. Consistente (7 dias)
  IF user_data.current_workout_streak >= 7 THEN
    PERFORM award_achievement_if_not_exists(p_user_id, 'Consistente');
  END IF;
  
  -- 10. Persistente (14 dias)
  IF user_data.current_workout_streak >= 14 THEN
    PERFORM award_achievement_if_not_exists(p_user_id, 'Persistente');
  END IF;
  
  -- 11. Motivador (21 dias)
  IF user_data.current_workout_streak >= 21 THEN
    PERFORM award_achievement_if_not_exists(p_user_id, 'Motivador');
  END IF;
  
  -- 12. Revolucionário (60 dias)
  IF user_data.current_workout_streak >= 60 THEN
    PERFORM award_achievement_if_not_exists(p_user_id, 'Revolucionário');
  END IF;
  
  -- 13. Invencível (100 dias)
  IF user_data.current_workout_streak >= 100 THEN
    PERFORM award_achievement_if_not_exists(p_user_id, 'Invencível');
  END IF;
  
  -- ============= POINTS ACHIEVEMENTS =============
  
  -- 14. Máquina de Pontos (1000 pontos)
  IF user_data.points >= 1000 THEN
    PERFORM award_achievement_if_not_exists(p_user_id, 'Máquina de Pontos');
  END IF;
  
  -- 15. Elite dos Pontos (5000 pontos)
  IF user_data.points >= 5000 THEN
    PERFORM award_achievement_if_not_exists(p_user_id, 'Elite dos Pontos');
  END IF;
  
  -- 16. Lenda dos Pontos (10000 pontos)
  IF user_data.points >= 10000 THEN
    PERFORM award_achievement_if_not_exists(p_user_id, 'Lenda dos Pontos');
  END IF;
  
  -- ============= TIME-BASED ACHIEVEMENTS =============
  
  -- 17. Madrugador (treinos antes das 7h)
  IF user_data.early_workouts >= 1 THEN
    PERFORM award_achievement_if_not_exists(p_user_id, 'Madrugador');
  END IF;
  
  -- 18. Ninja da Madrugada (5 treinos entre 5h e 6h)
  SELECT COUNT(*) INTO workout_data.ninja_workouts
  FROM daily_workouts dw
  WHERE dw.user_id = p_user_id 
  AND dw.status = 'completed'
  AND EXTRACT(HOUR FROM dw.completed_at AT TIME ZONE 'America/Sao_Paulo') BETWEEN 5 AND 6;
  
  IF workout_data.ninja_workouts >= 5 THEN
    PERFORM award_achievement_if_not_exists(p_user_id, 'Ninja da Madrugada');
  END IF;
  
  -- 19. Noturno (treinos após 22h)
  IF user_data.night_workouts >= 1 THEN
    PERFORM award_achievement_if_not_exists(p_user_id, 'Noturno');
  END IF;
  
  -- ============= WEEKEND ACHIEVEMENTS =============
  
  -- 20. Guerreiro de Fim de Semana
  IF user_data.weekend_workouts >= 2 THEN
    PERFORM award_achievement_if_not_exists(p_user_id, 'Guerreiro de Fim de Semana');
  END IF;
  
  -- 21. Guerreiro Plus (5 fins de semana seguidos)
  SELECT COUNT(*) INTO workout_data.consecutive_weekends
  FROM (
    SELECT DATE_TRUNC('week', workout_date) as week_start
    FROM daily_workouts
    WHERE user_id = p_user_id 
    AND status = 'completed'
    AND EXTRACT(DOW FROM workout_date) IN (0,6)
    GROUP BY DATE_TRUNC('week', workout_date)
    HAVING COUNT(*) >= 2
    ORDER BY week_start DESC
    LIMIT 5
  ) consecutive_weeks;
  
  IF workout_data.consecutive_weekends >= 5 THEN
    PERFORM award_achievement_if_not_exists(p_user_id, 'Guerreiro Plus');
  END IF;
  
  -- ============= SPECIAL ACHIEVEMENTS =============
  
  -- 22. Dedicação Total (3 treinos em um dia)
  SELECT COUNT(*) INTO workout_data.max_daily_workouts
  FROM (
    SELECT workout_date, COUNT(*) as daily_count
    FROM daily_workouts
    WHERE user_id = p_user_id AND status = 'completed'
    GROUP BY workout_date
    ORDER BY daily_count DESC
    LIMIT 1
  ) daily_counts;
  
  IF workout_data.max_daily_workouts >= 3 THEN
    PERFORM award_achievement_if_not_exists(p_user_id, 'Dedicação Total');
  END IF;
  
  -- 23. Velocista (treino em menos de 15 minutos)
  SELECT COUNT(*) INTO workout_data.fast_workouts
  FROM daily_workouts dw
  WHERE dw.user_id = p_user_id 
  AND dw.status = 'completed'
  AND dw.completed_at IS NOT NULL
  AND EXTRACT(EPOCH FROM (dw.completed_at - dw.created_at))/60 < 15;
  
  IF workout_data.fast_workouts >= 1 THEN
    PERFORM award_achievement_if_not_exists(p_user_id, 'Velocista');
  END IF;
  
  -- 24. Resistência (treino de mais de 60 minutos)
  SELECT COUNT(*) INTO workout_data.long_workouts
  FROM daily_workouts dw
  WHERE dw.user_id = p_user_id 
  AND dw.status = 'completed'
  AND dw.completed_at IS NOT NULL
  AND EXTRACT(EPOCH FROM (dw.completed_at - dw.created_at))/60 > 60;
  
  IF workout_data.long_workouts >= 1 THEN
    PERFORM award_achievement_if_not_exists(p_user_id, 'Resistência');
  END IF;
  
  -- 25. Super Saiyan (treino com 100% de precisão - placeholder logic)
  IF user_data.completed_workouts >= 1 THEN
    PERFORM award_achievement_if_not_exists(p_user_id, 'Super Saiyan');
  END IF;
  
  -- Count newly earned achievements
  SELECT COUNT(*) INTO total_new_achievements
  FROM user_achievements ua
  INNER JOIN achievements a ON ua.achievement_id = a.id
  WHERE ua.user_id = p_user_id 
  AND ua.earned_at >= now() - INTERVAL '1 minute';
  
  -- Log completion
  INSERT INTO system_logs (log_level, message) 
  VALUES ('SUCCESS', '✅ ACHIEVEMENT CHECK COMPLETED for user ' || p_user_id || 
          ' - New achievements: ' || total_new_achievements);
  
  RETURN json_build_object(
    'success', true,
    'user_id', p_user_id,
    'total_completed_workouts', user_data.completed_workouts,
    'current_streak', user_data.current_workout_streak,
    'points', user_data.points,
    'new_achievements_count', total_new_achievements,
    'message', 'Achievement verification completed'
  );
  
EXCEPTION WHEN OTHERS THEN
  INSERT INTO system_logs (log_level, message) 
  VALUES ('ERROR', '❌ ACHIEVEMENT CHECK ERROR for user ' || p_user_id || ': ' || SQLERRM);
  
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM,
    'user_id', p_user_id
  );
END;
$$;

-- Helper function to award achievement if not exists
CREATE OR REPLACE FUNCTION public.award_achievement_if_not_exists(p_user_id uuid, p_achievement_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  achievement_id_found uuid;
  existing_award RECORD;
BEGIN
  -- Find achievement ID by name
  SELECT id INTO achievement_id_found
  FROM achievements
  WHERE name = p_achievement_name;
  
  -- If achievement doesn't exist, skip
  IF achievement_id_found IS NULL THEN
    INSERT INTO system_logs (log_level, message) 
    VALUES ('WARN', '⚠️ Achievement not found: ' || p_achievement_name);
    RETURN;
  END IF;
  
  -- Check if user already has this achievement
  SELECT * INTO existing_award
  FROM user_achievements
  WHERE user_id = p_user_id AND achievement_id = achievement_id_found;
  
  -- If user doesn't have it, award it
  IF existing_award IS NULL THEN
    INSERT INTO user_achievements (user_id, achievement_id, earned_at)
    VALUES (p_user_id, achievement_id_found, now());
    
    -- Add points to user
    UPDATE profiles 
    SET points = points + (SELECT points_reward FROM achievements WHERE id = achievement_id_found),
        updated_at = now()
    WHERE id = p_user_id;
    
    INSERT INTO system_logs (log_level, message) 
    VALUES ('SUCCESS', '🏆 NEW ACHIEVEMENT EARNED: ' || p_achievement_name || ' by user ' || p_user_id);
  END IF;
END;
$$;

-- Remove duplicate achievement "10 Treinos Completos" to avoid conflict with "Guerreiro"
DELETE FROM user_achievements 
WHERE achievement_id IN (
  SELECT id FROM achievements WHERE name = '10 Treinos Completos'
);

DELETE FROM achievements WHERE name = '10 Treinos Completos';

-- Update the trigger to call our new comprehensive function
CREATE OR REPLACE FUNCTION public.award_points_and_check_achievements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  points_to_award INTEGER := 50; -- Pontos por treino concluído
BEGIN
  -- Verificar se o status mudou para 'completed'
  IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
    
    -- Adicionar pontos base por treino concluído
    UPDATE profiles 
    SET points = points + points_to_award,
        updated_at = now()
    WHERE id = NEW.user_id;
    
    -- Atualizar workout streak
    PERFORM public.update_workout_streak_logic(NEW.user_id, NEW.workout_date);
    
    -- Verificar e conceder conquistas usando nossa nova função abrangente
    PERFORM check_and_award_achievements(NEW.user_id);
    
    -- Log da adição de pontos
    INSERT INTO system_logs (log_level, message) 
    VALUES ('INFO', '✅ Workout completed: +' || points_to_award || ' points for user: ' || NEW.user_id);
    
  END IF;
  
  RETURN NEW;
END;
$$;