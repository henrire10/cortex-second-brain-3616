
-- Função "FIXED": aprova plano e cria/atualiza treinos aprovados para 30 dias
CREATE OR REPLACE FUNCTION public.approve_workout_plan_with_future_workouts_30_days_fixed(
  p_plan_id uuid,
  p_trainer_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  plan_record RECORD;
  trainer_rate NUMERIC;
  affected_workouts INTEGER := 0;
  future_workouts_created INTEGER := 0;
  plan_data_json JSONB;
  workout_days JSONB;
  total_workouts INTEGER;
  user_id_target UUID;

  day_counter INTEGER := 0;
  current_date_loop DATE;
  current_day_of_week INTEGER;

  workout_schedule INTEGER[];
  workout_index INTEGER;

  selected_workout JSONB;
  workout_content TEXT;
  existing_workout RECORD;

  brazil_today DATE := (now() AT TIME ZONE 'America/Sao_Paulo')::DATE;
BEGIN
  -- Buscar plano pendente
  SELECT *
    INTO plan_record
  FROM workout_plans_approval
  WHERE id = p_plan_id
    AND status = 'pending_approval'
  LIMIT 1;

  IF plan_record IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Plano não encontrado ou já processado'
    );
  END IF;

  -- Extrair dados do plano
  user_id_target  := plan_record.user_id;
  plan_data_json  := plan_record.plan_data;
  workout_days    := plan_data_json->'workoutDays';
  total_workouts  := COALESCE(jsonb_array_length(workout_days), 0);

  IF total_workouts = 0 THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Plano sem dias de treino (workoutDays vazio)'
    );
  END IF;

  -- Taxa do personal (fallback padrão)
  SELECT payout_rate_per_review
    INTO trainer_rate
  FROM profiles
  WHERE id = p_trainer_id;

  IF trainer_rate IS NULL THEN
    trainer_rate := 5.00;
  END IF;

  -- Determinar programação semanal baseada no número de treinos
  -- 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
  CASE total_workouts
    WHEN 1 THEN workout_schedule := ARRAY[3];                   -- Quarta
    WHEN 2 THEN workout_schedule := ARRAY[2, 5];               -- Terça e Sexta
    WHEN 3 THEN workout_schedule := ARRAY[1, 3, 5];            -- Segunda, Quarta, Sexta
    WHEN 4 THEN workout_schedule := ARRAY[1, 2, 4, 5];         -- Segunda, Terça, Quinta, Sexta
    WHEN 5 THEN workout_schedule := ARRAY[1, 2, 3, 4, 5];      -- Segunda à Sexta
    WHEN 6 THEN workout_schedule := ARRAY[1, 2, 3, 4, 5, 6];   -- Segunda ao Sábado
    ELSE workout_schedule := ARRAY[1, 3, 5];                   -- Padrão 3x semana
  END CASE;

  -- Atualizar plano para aprovado
  UPDATE workout_plans_approval
  SET
    status = 'approved',
    trainer_id = p_trainer_id,
    plan_payout = trainer_rate,
    updated_at = now()
  WHERE id = p_plan_id;

  -- Aprovar treinos existentes que já estejam linkados ao plano
  UPDATE daily_workouts
  SET
    status = 'sent',
    approval_status = 'approved',
    approved_by = p_trainer_id,
    approved_at = now()
  WHERE plan_id = p_plan_id
    AND user_id = user_id_target;

  GET DIAGNOSTICS affected_workouts = ROW_COUNT;

  -- Criar/Aprovar treinos para os próximos 30 dias (a partir da data BR atual)
  WHILE day_counter < 30 LOOP
    current_date_loop := brazil_today + day_counter;
    current_day_of_week := EXTRACT(DOW FROM current_date_loop);

    -- Pular Domingo sempre
    IF current_day_of_week = 0 THEN
      day_counter := day_counter + 1;
      CONTINUE;
    END IF;

    -- Verificar se o dia faz parte da grade programada
    workout_index := array_position(workout_schedule, current_day_of_week);

    IF workout_index IS NOT NULL THEN
      -- Seleciona o treino do dia (Seg=1 => índice 0; ...; Sáb=6 => índice 5)
      selected_workout := workout_days->(workout_index - 1);

      IF selected_workout IS NOT NULL THEN
        -- Verificar se já existe treino para a data
        SELECT *
          INTO existing_workout
        FROM daily_workouts
        WHERE user_id = user_id_target
          AND workout_date = current_date_loop
        LIMIT 1;

        -- Montar conteúdo do treino
        workout_content := '';
        FOR i IN 0..GREATEST(jsonb_array_length(selected_workout->'exercises') - 1, -1) LOOP
          EXIT WHEN i < 0;
          workout_content := workout_content ||
            (i + 1) || '️⃣ ' ||
            COALESCE(selected_workout->'exercises'->i->>'name', 'Exercício') || ': ' ||
            COALESCE(selected_workout->'exercises'->i->>'sets', '?') || 'x' ||
            COALESCE(selected_workout->'exercises'->i->>'reps', '?') ||
            CASE WHEN (selected_workout->'exercises'->i->>'rest') IS NOT NULL
                 THEN ', Descanso: ' || (selected_workout->'exercises'->i->>'rest')
                 ELSE '' END
            || E'\n';
        END LOOP;

        IF existing_workout IS NULL THEN
          -- Inserir novo treino já aprovado
          INSERT INTO daily_workouts (
            user_id,
            workout_date,
            workout_title,
            workout_content,
            status,
            approval_status,
            approved_by,
            approved_at,
            plan_id
          ) VALUES (
            user_id_target,
            current_date_loop,
            COALESCE(selected_workout->>'title', 'Treino'),
            workout_content,
            'sent',
            'approved',
            p_trainer_id,
            now(),
            p_plan_id
          );

          future_workouts_created := future_workouts_created + 1;
        ELSE
          -- Atualizar existente para aprovado e linkar ao plano
          UPDATE daily_workouts
          SET
            workout_title   = COALESCE(selected_workout->>'title', existing_workout.workout_title),
            workout_content = NULLIF(workout_content, '')::text,
            status          = 'sent',
            approval_status = 'approved',
            approved_by     = p_trainer_id,
            approved_at     = now(),
            plan_id         = p_plan_id,
            updated_at      = now()
          WHERE id = existing_workout.id;

          affected_workouts := affected_workouts + 1;
        END IF;
      END IF;
    END IF;

    day_counter := day_counter + 1;
  END LOOP;

  -- Log final
  INSERT INTO system_logs (log_level, message)
  VALUES (
    'SUCCESS',
    'APROVAÇÃO SEMANAL → 30 DIAS: plano ' || p_plan_id ||
    ', user ' || user_id_target ||
    ', atualizados=' || affected_workouts ||
    ', criados=' || future_workouts_created
  );

  RETURN json_build_object(
    'success', true,
    'plan_payout', trainer_rate,
    'workouts_updated', affected_workouts,
    'future_workouts_created', future_workouts_created,
    'message', 'Plano aprovado — treinos das próximas semanas criados e aprovados automaticamente'
  );
END;
$function$;

-- Padronizar o RPC principal para chamar a função "fixed"
CREATE OR REPLACE FUNCTION public.approve_workout_plan(
  p_plan_id uuid,
  p_trainer_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN public.approve_workout_plan_with_future_workouts_30_days_fixed(p_plan_id, p_trainer_id);
END;
$function$;
