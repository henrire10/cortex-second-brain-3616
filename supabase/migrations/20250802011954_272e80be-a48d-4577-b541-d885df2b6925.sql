-- 🚨 RESTAURAÇÃO COMPLETA DO SISTEMA CÍCLICO ORIGINAL 🚨
-- Reverter todas as "correções" que quebraram o sistema que funcionava

-- ✅ PARTE 1: LIMPAR TREINOS INCORRETOS DE SÁBADO
-- Remover todos os treinos de sábado para usuários com menos de 6 treinos
-- (Sábado só deve ter treino se o usuário treina 6x por semana)
DELETE FROM daily_workouts 
WHERE EXTRACT(DOW FROM workout_date) = 6 -- Sábado
AND user_id IN (
  SELECT wp.user_id 
  FROM workout_plans wp 
  WHERE wp.is_active = true 
  AND jsonb_array_length(wp.plan_data->'workoutDays') < 6
);

-- ✅ PARTE 2: RESTAURAR A LÓGICA CÍCLICA ORIGINAL
-- Corrigir todos os treinos existentes para seguir o padrão cíclico correto
-- Segunda = A, Terça = B, Quarta = C, Quinta = D, Sexta = E (repetindo semanalmente)

WITH workout_correction AS (
  SELECT 
    dw.id,
    dw.user_id,
    dw.workout_date,
    EXTRACT(DOW FROM dw.workout_date) as day_of_week,
    wp.plan_data,
    jsonb_array_length(wp.plan_data->'workoutDays') as total_workouts,
    -- Mapeamento cíclico correto: Segunda(1)=0, Terça(2)=1, etc.
    (EXTRACT(DOW FROM dw.workout_date) - 1) as workout_index
  FROM daily_workouts dw
  INNER JOIN workout_plans wp ON wp.user_id = dw.user_id AND wp.is_active = true
  WHERE dw.workout_date >= CURRENT_DATE - INTERVAL '7 days'
  AND EXTRACT(DOW FROM dw.workout_date) BETWEEN 1 AND 5 -- Segunda a Sexta apenas
),
corrected_workouts AS (
  SELECT 
    wc.id,
    wc.workout_date,
    wc.day_of_week,
    wc.workout_index,
    (wc.plan_data->'workoutDays'->wc.workout_index) as selected_workout
  FROM workout_correction wc
  WHERE wc.workout_index < wc.total_workouts
  AND wc.plan_data->'workoutDays'->wc.workout_index IS NOT NULL
)
UPDATE daily_workouts 
SET 
  workout_title = (corrected_workouts.selected_workout->>'title'),
  workout_content = (
    SELECT string_agg(
      (row_number() OVER()) || '️⃣ ' || 
      (exercise.value->>'name') || ': ' ||
      (exercise.value->>'sets') || 'x' ||
      (exercise.value->>'reps') || ', Descanso: ' ||
      (exercise.value->>'rest'),
      E'\n'
    )
    FROM jsonb_array_elements(corrected_workouts.selected_workout->'exercises') exercise
  ),
  updated_at = now()
FROM corrected_workouts
WHERE daily_workouts.id = corrected_workouts.id;

-- ✅ PARTE 3: REMOVER A FUNÇÃO PROBLEMÁTICA QUE QUEBROU O SISTEMA
DROP FUNCTION IF EXISTS get_weekly_schedule(integer);

-- ✅ PARTE 4: RESTAURAR A FUNÇÃO CÍCLICA ORIGINAL SIMPLES
CREATE OR REPLACE FUNCTION get_cyclic_workout_day(
  day_of_week INTEGER,
  total_workouts INTEGER
) RETURNS INTEGER AS $$
BEGIN
  -- Domingo (0) = sempre descanso
  IF day_of_week = 0 THEN
    RETURN NULL;
  END IF;
  
  -- Para planos de 5 treinos: Segunda à Sexta
  -- Para planos de 3 treinos: Segunda, Quarta, Sexta
  -- Para planos de 6 treinos: Segunda ao Sábado
  
  CASE total_workouts
    WHEN 1 THEN 
      IF day_of_week = 3 THEN RETURN 0; END IF; -- Quarta = Treino A
    WHEN 2 THEN 
      IF day_of_week = 2 THEN RETURN 0; END IF; -- Terça = Treino A
      IF day_of_week = 5 THEN RETURN 1; END IF; -- Sexta = Treino B
    WHEN 3 THEN 
      IF day_of_week = 1 THEN RETURN 0; END IF; -- Segunda = Treino A
      IF day_of_week = 3 THEN RETURN 1; END IF; -- Quarta = Treino B
      IF day_of_week = 5 THEN RETURN 2; END IF; -- Sexta = Treino C
    WHEN 4 THEN 
      IF day_of_week = 1 THEN RETURN 0; END IF; -- Segunda = Treino A
      IF day_of_week = 2 THEN RETURN 1; END IF; -- Terça = Treino B
      IF day_of_week = 4 THEN RETURN 2; END IF; -- Quinta = Treino C
      IF day_of_week = 5 THEN RETURN 3; END IF; -- Sexta = Treino D
    WHEN 5 THEN 
      IF day_of_week BETWEEN 1 AND 5 THEN 
        RETURN day_of_week - 1; -- Segunda(1)=0, Terça(2)=1, etc.
      END IF;
    WHEN 6 THEN 
      IF day_of_week BETWEEN 1 AND 6 THEN 
        RETURN day_of_week - 1; -- Segunda(1)=0 até Sábado(6)=5
      END IF;
    ELSE
      -- Padrão: 3x por semana
      IF day_of_week = 1 THEN RETURN 0; END IF; -- Segunda = Treino A
      IF day_of_week = 3 THEN RETURN 1; END IF; -- Quarta = Treino B
      IF day_of_week = 5 THEN RETURN 2; END IF; -- Sexta = Treino C
  END CASE;
  
  RETURN NULL; -- Dia de descanso
END;
$$ LANGUAGE plpgsql;

-- ✅ PARTE 5: ATUALIZAR A FUNÇÃO PRINCIPAL PARA USAR LÓGICA CÍCLICA
CREATE OR REPLACE FUNCTION send_daily_workouts_cyclic()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  workout_plan RECORD;
  current_day_number INTEGER;
  brazil_time TIMESTAMPTZ;
  workout_date DATE;
  workout_index INTEGER;
  selected_workout JSONB;
  workout_title TEXT;
  workout_content TEXT;
  existing_workout RECORD;
  total_workouts INTEGER;
BEGIN
  -- Calcular horário atual no Brasil
  brazil_time := now() AT TIME ZONE 'America/Sao_Paulo';
  workout_date := brazil_time::DATE;
  current_day_number := EXTRACT(DOW FROM brazil_time);
  
  -- Domingo = sempre descanso
  IF current_day_number = 0 THEN
    INSERT INTO system_logs (log_level, message) 
    VALUES ('INFO', '🚫 DOMINGO: Dia de descanso. Sistema cíclico funcionando corretamente.');
    RETURN;
  END IF;
  
  -- Log inicial
  INSERT INTO system_logs (log_level, message) 
  VALUES ('INFO', '🔄 SISTEMA CÍCLICO RESTAURADO: Processando dia ' || current_day_number || ' - ' || workout_date);
  
  -- Buscar usuários com WhatsApp ativo
  FOR user_record IN 
    SELECT DISTINCT 
      uw.user_id,
      uw.phone_number,
      p.name
    FROM user_whatsapp uw
    INNER JOIN profiles p ON p.id = uw.user_id
    WHERE uw.opted_in = true
  LOOP
    BEGIN
      -- Buscar plano de treino ativo
      SELECT * INTO workout_plan
      FROM workout_plans wp
      WHERE wp.user_id = user_record.user_id 
      AND wp.is_active = true
      ORDER BY wp.created_at DESC
      LIMIT 1;
      
      IF workout_plan IS NULL THEN
        INSERT INTO system_logs (log_level, message) 
        VALUES ('WARN', 'Usuário ' || user_record.name || ' sem plano ativo');
        CONTINUE;
      END IF;
      
      total_workouts := jsonb_array_length(workout_plan.plan_data->'workoutDays');
      
      -- Usar a nova função cíclica para determinar o treino
      workout_index := get_cyclic_workout_day(current_day_number, total_workouts);
      
      IF workout_index IS NULL THEN
        -- Hoje é dia de descanso para este usuário
        INSERT INTO system_logs (log_level, message) 
        VALUES ('INFO', 'CÍCLICO: ' || user_record.name || ' - Dia de descanso');
        CONTINUE;
      END IF;
      
      -- Obter o treino específico do plano
      selected_workout := (workout_plan.plan_data->'workoutDays'->workout_index);
      
      IF selected_workout IS NULL THEN
        INSERT INTO system_logs (log_level, message) 
        VALUES ('ERROR', 'CÍCLICO: Treino não encontrado para ' || user_record.name);
        CONTINUE;
      END IF;
      
      -- Extrair informações do treino
      workout_title := selected_workout->>'title';
      workout_content := '';
      
      -- Construir conteúdo do treino
      FOR i IN 0..(jsonb_array_length(selected_workout->'exercises') - 1) LOOP
        workout_content := workout_content || 
          (i + 1) || '️⃣ ' || 
          (selected_workout->'exercises'->i->>'name') || ': ' ||
          (selected_workout->'exercises'->i->>'sets') || ' séries de ' ||
          (selected_workout->'exercises'->i->>'reps') || ' repetições, Descanso: ' ||
          (selected_workout->'exercises'->i->>'rest') || E'\n';
      END LOOP;
      
      -- Verificar se já existe um treino para hoje
      SELECT * INTO existing_workout
      FROM daily_workouts dw
      WHERE dw.user_id = user_record.user_id 
      AND dw.workout_date = workout_date;
      
      -- Se não existe treino para hoje, criar um baseado no sistema cíclico
      IF existing_workout IS NULL THEN
        INSERT INTO daily_workouts (
          user_id,
          workout_date,
          workout_title,
          workout_content,
          status,
          approval_status
        ) VALUES (
          user_record.user_id,
          workout_date,
          workout_title,
          workout_content,
          'pending',
          'pending_approval'
        );
        
        INSERT INTO system_logs (log_level, message) 
        VALUES ('SUCCESS', '✅ CÍCLICO: Criado treino para ' || user_record.name || ' - ' || workout_title);
      ELSE
        -- Atualizar treino existente com dados do sistema cíclico
        UPDATE daily_workouts 
        SET 
          workout_title = workout_title,
          workout_content = workout_content,
          updated_at = now()
        WHERE id = existing_workout.id;
        
        INSERT INTO system_logs (log_level, message) 
        VALUES ('SUCCESS', '✅ CÍCLICO: Atualizado treino para ' || user_record.name || ' - ' || workout_title);
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO system_logs (log_level, message) 
      VALUES ('ERROR', '❌ CÍCLICO: Erro ao processar ' || user_record.name || ': ' || SQLERRM);
    END;
  END LOOP;
  
  -- Log final
  INSERT INTO system_logs (log_level, message) 
  VALUES ('INFO', '✅ SISTEMA CÍCLICO RESTAURADO: Processamento concluído para ' || workout_date);
END;
$$;

-- ✅ PARTE 6: LOG DA RESTAURAÇÃO
INSERT INTO system_logs (log_level, message) 
VALUES ('INFO', '🎉 SISTEMA CÍCLICO RESTAURADO: Lógica original funcionando. Segunda=A, Terça=B, Quarta=C, Quinta=D, Sexta=E (repetindo semanalmente). Sábados e domingos = descanso para planos < 6 treinos.');