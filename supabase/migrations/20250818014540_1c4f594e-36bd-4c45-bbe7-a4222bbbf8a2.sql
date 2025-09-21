
-- Remover conquista duplicada "Primeiro Treino" e manter apenas "Primeira Vitória"
-- Primeiro, migrar os registros de user_achievements da conquista "Primeiro Treino" para "Primeira Vitória"
UPDATE user_achievements 
SET achievement_id = (
  SELECT id FROM achievements WHERE name = 'Primeira Vitória' LIMIT 1
)
WHERE achievement_id = (
  SELECT id FROM achievements WHERE name = 'Primeiro Treino' LIMIT 1
)
AND NOT EXISTS (
  -- Evitar duplicatas: só migrar se o usuário não tem "Primeira Vitória"
  SELECT 1 FROM user_achievements ua2 
  WHERE ua2.user_id = user_achievements.user_id 
  AND ua2.achievement_id = (SELECT id FROM achievements WHERE name = 'Primeira Vitória' LIMIT 1)
);

-- Remover registros duplicados que não puderam ser migrados
DELETE FROM user_achievements 
WHERE achievement_id = (
  SELECT id FROM achievements WHERE name = 'Primeiro Treino' LIMIT 1
);

-- Remover a conquista "Primeiro Treino" da tabela achievements
DELETE FROM achievements WHERE name = 'Primeiro Treino';

-- Atualizar a função check_and_award_achievements para usar o nome correto
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
  
  -- Log para debugging
  INSERT INTO system_logs (log_level, message) 
  VALUES ('INFO', 'CONQUISTAS: Verificando para usuário: ' || COALESCE(p_user_id::text, 'NULL') || 
          ', Treinos completos: ' || COALESCE(completed_workouts::text, '0') || 
          ', Sequência atual: ' || COALESCE(current_streak::text, '0'));
  
  -- Verificar conquista "Primeira Vitória" (nome correto)
  IF completed_workouts >= 1 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    SELECT p_user_id, id FROM achievements WHERE name = 'Primeira Vitória'
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    
    IF FOUND THEN
      SELECT points_reward INTO points_awarded FROM achievements WHERE name = 'Primeira Vitória';
      
      UPDATE profiles 
      SET points = points + points_awarded,
          updated_at = now()
      WHERE id = p_user_id;
      
      INSERT INTO system_logs (log_level, message) 
      VALUES ('SUCCESS', 'CONQUISTA CONCEDIDA: Primeira Vitória - ' || COALESCE(points_awarded::text, '0') || ' pontos para usuário: ' || COALESCE(p_user_id::text, 'NULL'));
    END IF;
  END IF;
  
  -- Verificar conquista "Consistente" (7 dias)
  IF current_streak >= 7 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    SELECT p_user_id, id FROM achievements WHERE name = 'Consistente'
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    
    IF FOUND THEN
      SELECT points_reward INTO points_awarded FROM achievements WHERE name = 'Consistente';
      
      UPDATE profiles 
      SET points = points + COALESCE(points_awarded, 0),
          updated_at = now()
      WHERE id = p_user_id;
      
      INSERT INTO system_logs (log_level, message) 
      VALUES ('SUCCESS', 'CONQUISTA CONCEDIDA: Consistente - ' || COALESCE(points_awarded::text, '0') || ' pontos para usuário: ' || COALESCE(p_user_id::text, 'NULL'));
    END IF;
  END IF;
  
  -- Verificar conquista "Guerreiro" (10 treinos)
  IF completed_workouts >= 10 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    SELECT p_user_id, id FROM achievements WHERE name = 'Guerreiro'
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    
    IF FOUND THEN
      SELECT points_reward INTO points_awarded FROM achievements WHERE name = 'Guerreiro';
      
      UPDATE profiles 
      SET points = points + COALESCE(points_awarded, 0),
          updated_at = now()
      WHERE id = p_user_id;
      
      INSERT INTO system_logs (log_level, message) 
      VALUES ('SUCCESS', 'CONQUISTA CONCEDIDA: Guerreiro - ' || COALESCE(points_awarded::text, '0') || ' pontos para usuário: ' || COALESCE(p_user_id::text, 'NULL'));
    END IF;
  END IF;
  
  -- Log final
  INSERT INTO system_logs (log_level, message) 
  VALUES ('INFO', 'CONQUISTAS: Verificação concluída para usuário: ' || COALESCE(p_user_id::text, 'NULL'));
  
END;
$function$;
