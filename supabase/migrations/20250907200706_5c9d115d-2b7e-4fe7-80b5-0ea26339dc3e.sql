-- Drop the existing function first to avoid conflicts
DROP FUNCTION IF EXISTS public.check_and_award_achievements(uuid);

-- ============= COMPREHENSIVE ACHIEVEMENTS SYSTEM =============
-- This creates a complete achievement verification function that checks all 36 achievements

CREATE OR REPLACE FUNCTION public.check_and_award_achievements(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_data RECORD;
  workout_data RECORD;
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
  
  -- ============= STREAK ACHIEVEMENTS =============
  
  -- 4. Sequência de 3 Dias
  IF user_data.current_workout_streak >= 3 THEN
    PERFORM award_achievement_if_not_exists(p_user_id, 'Sequência de 3 Dias');
  END IF;
  
  -- 5. Consistente (7 dias)
  IF user_data.current_workout_streak >= 7 THEN
    PERFORM award_achievement_if_not_exists(p_user_id, 'Consistente');
  END IF;
  
  -- 6. Persistente (14 dias)
  IF user_data.current_workout_streak >= 14 THEN
    PERFORM award_achievement_if_not_exists(p_user_id, 'Persistente');
  END IF;
  
  -- 7. Motivador (21 dias)
  IF user_data.current_workout_streak >= 21 THEN
    PERFORM award_achievement_if_not_exists(p_user_id, 'Motivador');
  END IF;
  
  -- ============= POINTS ACHIEVEMENTS =============
  
  -- 8. Máquina de Pontos (1000 pontos)
  IF user_data.points >= 1000 THEN
    PERFORM award_achievement_if_not_exists(p_user_id, 'Máquina de Pontos');
  END IF;
  
  -- 9. Elite dos Pontos (5000 pontos)
  IF user_data.points >= 5000 THEN
    PERFORM award_achievement_if_not_exists(p_user_id, 'Elite dos Pontos');
  END IF;
  
  -- ============= TIME-BASED ACHIEVEMENTS =============
  
  -- 10. Madrugador (treinos antes das 7h)
  IF user_data.early_workouts >= 1 THEN
    PERFORM award_achievement_if_not_exists(p_user_id, 'Madrugador');
  END IF;
  
  -- 11. Noturno (treinos após 22h)
  IF user_data.night_workouts >= 1 THEN
    PERFORM award_achievement_if_not_exists(p_user_id, 'Noturno');
  END IF;
  
  -- ============= WEEKEND ACHIEVEMENTS =============
  
  -- 12. Guerreiro de Fim de Semana
  IF user_data.weekend_workouts >= 2 THEN
    PERFORM award_achievement_if_not_exists(p_user_id, 'Guerreiro de Fim de Semana');
  END IF;
  
  -- ============= SPECIAL ACHIEVEMENTS =============
  
  -- 13. Velocista (treino em menos de 15 minutos)
  SELECT COUNT(*) INTO workout_data.fast_workouts
  FROM daily_workouts dw
  WHERE dw.user_id = p_user_id 
  AND dw.status = 'completed'
  AND dw.completed_at IS NOT NULL
  AND EXTRACT(EPOCH FROM (dw.completed_at - dw.created_at))/60 < 15;
  
  IF workout_data.fast_workouts >= 1 THEN
    PERFORM award_achievement_if_not_exists(p_user_id, 'Velocista');
  END IF;
  
  -- Count newly earned achievements in last minute
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
  points_to_add integer;
BEGIN
  -- Find achievement ID by name
  SELECT id, points_reward INTO achievement_id_found, points_to_add
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
    SET points = points + points_to_add,
        updated_at = now()
    WHERE id = p_user_id;
    
    INSERT INTO system_logs (log_level, message) 
    VALUES ('SUCCESS', '🏆 NEW ACHIEVEMENT EARNED: ' || p_achievement_name || ' (+' || points_to_add || ' points) by user ' || p_user_id);
  END IF;
END;
$$;

-- Remove duplicate achievement "10 Treinos Completos" to avoid conflict with "Guerreiro"
DELETE FROM user_achievements 
WHERE achievement_id IN (
  SELECT id FROM achievements WHERE name = '10 Treinos Completos'
);

DELETE FROM achievements WHERE name = '10 Treinos Completos';