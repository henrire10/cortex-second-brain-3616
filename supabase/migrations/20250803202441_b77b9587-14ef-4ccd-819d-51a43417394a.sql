-- Corrigir função check_and_award_achievements para evitar NULL em logs
CREATE OR REPLACE FUNCTION public.check_and_award_achievements(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  completed_workouts INTEGER := 0;
  current_streak INTEGER := 0;
  achievement_record RECORD;
  points_awarded INTEGER := 0;
BEGIN
  -- Contar treinos completos do usuário
  SELECT COUNT(*) INTO completed_workouts
  FROM daily_workouts
  WHERE user_id = p_user_id AND status = 'completed';
  
  -- Calcular sequência atual de dias consecutivos
  WITH daily_completions AS (
    SELECT DISTINCT workout_date
    FROM daily_workouts 
    WHERE user_id = p_user_id 
    AND status = 'completed'
    AND workout_date >= CURRENT_DATE - INTERVAL '30 days'
    ORDER BY workout_date DESC
  ),
  consecutive_days AS (
    SELECT workout_date,
           ROW_NUMBER() OVER (ORDER BY workout_date DESC) as rn,
           workout_date + INTERVAL '1 day' * ROW_NUMBER() OVER (ORDER BY workout_date DESC) as expected_date
    FROM daily_completions
  ),
  streak_check AS (
    SELECT COUNT(*) as streak_length
    FROM consecutive_days
    WHERE expected_date = (SELECT MAX(workout_date) + INTERVAL '1 day' FROM daily_completions)
       OR workout_date = (SELECT MAX(workout_date) FROM daily_completions)
  )
  SELECT COALESCE(streak_length, 0) INTO current_streak FROM streak_check;
  
  -- Log para debugging com COALESCE para evitar NULL
  INSERT INTO system_logs (log_level, message) 
  VALUES ('INFO', 'CONQUISTAS: Verificando para usuário: ' || COALESCE(p_user_id::text, 'NULL') || 
          ', Treinos completos: ' || COALESCE(completed_workouts::text, '0') || 
          ', Sequência atual: ' || COALESCE(current_streak::text, '0'));
  
  -- Verificar conquista "Primeiro Treino"
  IF completed_workouts >= 1 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    SELECT p_user_id, id FROM achievements WHERE name = 'Primeiro Treino'
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    
    IF FOUND THEN
      SELECT points_reward INTO points_awarded FROM achievements WHERE name = 'Primeiro Treino';
      
      UPDATE profiles 
      SET points = points + points_awarded,
          updated_at = now()
      WHERE id = p_user_id;
      
      INSERT INTO system_logs (log_level, message) 
      VALUES ('SUCCESS', 'CONQUISTA CONCEDIDA: Primeiro Treino - ' || COALESCE(points_awarded::text, '0') || ' pontos para usuário: ' || COALESCE(p_user_id::text, 'NULL'));
    END IF;
  END IF;
  
  -- Verificar conquista "Sequência de 3 Dias"
  IF current_streak >= 3 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    SELECT p_user_id, id FROM achievements WHERE name = 'Sequência de 3 Dias'
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    
    IF FOUND THEN
      SELECT points_reward INTO points_awarded FROM achievements WHERE name = 'Sequência de 3 Dias';
      
      UPDATE profiles 
      SET points = points + COALESCE(points_awarded, 0),
          updated_at = now()
      WHERE id = p_user_id;
      
      INSERT INTO system_logs (log_level, message) 
      VALUES ('SUCCESS', 'CONQUISTA CONCEDIDA: Sequência de 3 Dias - ' || COALESCE(points_awarded::text, '0') || ' pontos para usuário: ' || COALESCE(p_user_id::text, 'NULL'));
    END IF;
  END IF;
  
  -- Verificar outras conquistas de sequência
  IF current_streak >= 7 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    SELECT p_user_id, id FROM achievements WHERE name = 'Sequência de 7 Dias'
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    
    IF FOUND THEN
      SELECT points_reward INTO points_awarded FROM achievements WHERE name = 'Sequência de 7 Dias';
      
      UPDATE profiles 
      SET points = points + COALESCE(points_awarded, 0),
          updated_at = now()
      WHERE id = p_user_id;
      
      INSERT INTO system_logs (log_level, message) 
      VALUES ('SUCCESS', 'CONQUISTA CONCEDIDA: Sequência de 7 Dias - ' || COALESCE(points_awarded::text, '0') || ' pontos para usuário: ' || COALESCE(p_user_id::text, 'NULL'));
    END IF;
  END IF;
  
  -- Verificar conquistas de quantidade de treinos
  IF completed_workouts >= 10 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    SELECT p_user_id, id FROM achievements WHERE name = '10 Treinos Completos'
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    
    IF FOUND THEN
      SELECT points_reward INTO points_awarded FROM achievements WHERE name = '10 Treinos Completos';
      
      UPDATE profiles 
      SET points = points + COALESCE(points_awarded, 0),
          updated_at = now()
      WHERE id = p_user_id;
      
      INSERT INTO system_logs (log_level, message) 
      VALUES ('SUCCESS', 'CONQUISTA CONCEDIDA: 10 Treinos Completos - ' || COALESCE(points_awarded::text, '0') || ' pontos para usuário: ' || COALESCE(p_user_id::text, 'NULL'));
    END IF;
  END IF;
  
  -- Log final
  INSERT INTO system_logs (log_level, message) 
  VALUES ('INFO', 'CONQUISTAS: Verificação concluída para usuário: ' || COALESCE(p_user_id::text, 'NULL'));
  
END;
$function$;