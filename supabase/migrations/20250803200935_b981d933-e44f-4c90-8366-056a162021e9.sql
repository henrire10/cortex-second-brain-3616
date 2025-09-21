-- Corrigir a função de verificação de conquistas para somar pontos corretamente
CREATE OR REPLACE FUNCTION public.check_and_award_achievements(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  completed_workouts INTEGER;
  current_streak INTEGER;
  achievement_record RECORD;
  points_awarded INTEGER := 0;
BEGIN
  -- Contar treinos completos do usuário
  SELECT COUNT(*) INTO completed_workouts
  FROM daily_workouts
  WHERE user_id = p_user_id AND status = 'completed';
  
  -- Calcular sequência atual
  WITH daily_completions AS (
    SELECT workout_date, 
           ROW_NUMBER() OVER (ORDER BY workout_date DESC) as rn,
           workout_date - INTERVAL '1 day' * (ROW_NUMBER() OVER (ORDER BY workout_date DESC) - 1) as streak_date
    FROM daily_workouts 
    WHERE user_id = p_user_id 
    AND status = 'completed'
    AND workout_date >= CURRENT_DATE - INTERVAL '30 days'
    ORDER BY workout_date DESC
  ),
  streak_groups AS (
    SELECT COUNT(*) as streak_length
    FROM daily_completions
    WHERE streak_date = (SELECT MIN(streak_date) FROM daily_completions)
  )
  SELECT COALESCE(streak_length, 0) INTO current_streak FROM streak_groups;
  
  -- Log para debugging
  INSERT INTO system_logs (log_level, message) 
  VALUES ('INFO', 'CONQUISTAS: Verificando para usuário: ' || p_user_id || 
          ', Treinos completos: ' || completed_workouts || 
          ', Sequência atual: ' || current_streak);
  
  -- Verificar conquista "Primeiro Treino"
  IF completed_workouts >= 1 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    SELECT p_user_id, id FROM achievements WHERE name = 'Primeiro Treino'
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    
    -- Se foi inserida (primeira vez), somar pontos
    IF FOUND THEN
      SELECT points_reward INTO points_awarded FROM achievements WHERE name = 'Primeiro Treino';
      
      UPDATE profiles 
      SET points = points + points_awarded,
          updated_at = now()
      WHERE id = p_user_id;
      
      INSERT INTO system_logs (log_level, message) 
      VALUES ('SUCCESS', 'CONQUISTA CONCEDIDA: Primeiro Treino - ' || points_awarded || ' pontos para usuário: ' || p_user_id);
    END IF;
  END IF;
  
  -- Verificar conquista "10 Treinos Completos"
  IF completed_workouts >= 10 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    SELECT p_user_id, id FROM achievements WHERE name = '10 Treinos Completos'
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    
    IF FOUND THEN
      SELECT points_reward INTO points_awarded FROM achievements WHERE name = '10 Treinos Completos';
      
      UPDATE profiles 
      SET points = points + points_awarded,
          updated_at = now()
      WHERE id = p_user_id;
      
      INSERT INTO system_logs (log_level, message) 
      VALUES ('SUCCESS', 'CONQUISTA CONCEDIDA: 10 Treinos Completos - ' || points_awarded || ' pontos para usuário: ' || p_user_id);
    END IF;
  END IF;
  
  -- Verificar conquista "50 Treinos Completos"
  IF completed_workouts >= 50 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    SELECT p_user_id, id FROM achievements WHERE name = '50 Treinos Completos'
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    
    IF FOUND THEN
      SELECT points_reward INTO points_awarded FROM achievements WHERE name = '50 Treinos Completos';
      
      UPDATE profiles 
      SET points = points + points_awarded,
          updated_at = now()
      WHERE id = p_user_id;
      
      INSERT INTO system_logs (log_level, message) 
      VALUES ('SUCCESS', 'CONQUISTA CONCEDIDA: 50 Treinos Completos - ' || points_awarded || ' pontos para usuário: ' || p_user_id);
    END IF;
  END IF;
  
  -- Verificar conquista "100 Treinos Completos"
  IF completed_workouts >= 100 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    SELECT p_user_id, id FROM achievements WHERE name = '100 Treinos Completos'
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    
    IF FOUND THEN
      SELECT points_reward INTO points_awarded FROM achievements WHERE name = '100 Treinos Completos';
      
      UPDATE profiles 
      SET points = points + points_awarded,
          updated_at = now()
      WHERE id = p_user_id;
      
      INSERT INTO system_logs (log_level, message) 
      VALUES ('SUCCESS', 'CONQUISTA CONCEDIDA: 100 Treinos Completos - ' || points_awarded || ' pontos para usuário: ' || p_user_id);
    END IF;
  END IF;
  
  -- Verificar conquistas de sequência
  IF current_streak >= 3 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    SELECT p_user_id, id FROM achievements WHERE name = 'Sequência de 3 Dias'
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    
    IF FOUND THEN
      SELECT points_reward INTO points_awarded FROM achievements WHERE name = 'Sequência de 3 Dias';
      
      UPDATE profiles 
      SET points = points + points_awarded,
          updated_at = now()
      WHERE id = p_user_id;
      
      INSERT INTO system_logs (log_level, message) 
      VALUES ('SUCCESS', 'CONQUISTA CONCEDIDA: Sequência de 3 Dias - ' || points_awarded || ' pontos para usuário: ' || p_user_id);
    END IF;
  END IF;
  
  IF current_streak >= 7 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    SELECT p_user_id, id FROM achievements WHERE name = 'Sequência de 7 Dias'
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    
    IF FOUND THEN
      SELECT points_reward INTO points_awarded FROM achievements WHERE name = 'Sequência de 7 Dias';
      
      UPDATE profiles 
      SET points = points + points_awarded,
          updated_at = now()
      WHERE id = p_user_id;
      
      INSERT INTO system_logs (log_level, message) 
      VALUES ('SUCCESS', 'CONQUISTA CONCEDIDA: Sequência de 7 Dias - ' || points_awarded || ' pontos para usuário: ' || p_user_id);
    END IF;
  END IF;
  
  IF current_streak >= 30 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    SELECT p_user_id, id FROM achievements WHERE name = 'Sequência de 30 Dias'
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    
    IF FOUND THEN
      SELECT points_reward INTO points_awarded FROM achievements WHERE name = 'Sequência de 30 Dias';
      
      UPDATE profiles 
      SET points = points + points_awarded,
          updated_at = now()
      WHERE id = p_user_id;
      
      INSERT INTO system_logs (log_level, message) 
      VALUES ('SUCCESS', 'CONQUISTA CONCEDIDA: Sequência de 30 Dias - ' || points_awarded || ' pontos para usuário: ' || p_user_id);
    END IF;
  END IF;
  
  -- Log final
  INSERT INTO system_logs (log_level, message) 
  VALUES ('INFO', 'CONQUISTAS: Verificação concluída para usuário: ' || p_user_id);
  
END;
$function$;

-- Corrigir manualmente os pontos do usuário atual que já tem a conquista mas não recebeu os pontos
UPDATE profiles 
SET points = points + 100
WHERE id = '3b4ec923-b37b-4dcb-8b7a-abf1a9ed6b3b' 
AND EXISTS (
  SELECT 1 FROM user_achievements ua 
  JOIN achievements a ON a.id = ua.achievement_id 
  WHERE ua.user_id = '3b4ec923-b37b-4dcb-8b7a-abf1a9ed6b3b' 
  AND a.name = 'Primeiro Treino'
);

INSERT INTO system_logs (log_level, message) 
VALUES ('INFO', 'CORREÇÃO: Adicionados 100 pontos da conquista Primeiro Treino para usuário 3b4ec923-b37b-4dcb-8b7a-abf1a9ed6b3b');