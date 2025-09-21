-- ✅ CORREÇÃO CRÍTICA: Função corrigida para aprovação em cascata
-- Esta função agora cria treinos futuros automaticamente quando um plano é aprovado

CREATE OR REPLACE FUNCTION public.approve_workout_plan_with_future_workouts(p_plan_id uuid, p_trainer_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  plan_record RECORD;
  trainer_rate NUMERIC;
  affected_workouts INTEGER := 0;
  future_workouts_created INTEGER := 0;
  plan_data_json JSONB;
  workout_days JSONB;
  total_workouts INTEGER;
  user_id_target UUID;
  day_counter INTEGER;
  current_date_loop DATE;
  current_day_of_week INTEGER;
  workout_schedule INTEGER[];
  workout_index INTEGER;
  selected_workout JSONB;
  workout_content TEXT;
  existing_workout_check RECORD;
BEGIN
  -- Buscar dados do plano de aprovação
  SELECT * INTO plan_record
  FROM workout_plans_approval
  WHERE id = p_plan_id
  AND status = 'pending_approval';
  
  IF plan_record IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Plano não encontrado ou já processado'
    );
  END IF;
  
  -- Extrair dados importantes
  user_id_target := plan_record.user_id;
  plan_data_json := plan_record.plan_data;
  workout_days := plan_data_json->'workoutDays';
  total_workouts := jsonb_array_length(workout_days);
  
  -- Log inicial
  INSERT INTO system_logs (log_level, message) 
  VALUES ('INFO', 'APROVAÇÃO EM CASCATA: Iniciando para plano ' || p_plan_id || 
          ', usuário: ' || user_id_target || ', treinos: ' || total_workouts);
  
  -- Buscar taxa do personal trainer
  SELECT payout_rate_per_review INTO trainer_rate
  FROM profiles
  WHERE id = p_trainer_id;
  
  IF trainer_rate IS NULL THEN
    trainer_rate := 5.00; -- Taxa padrão
  END IF;
  
  -- Determinar programação semanal baseada no número de treinos
  CASE total_workouts
    WHEN 1 THEN workout_schedule := ARRAY[3]; -- Quarta
    WHEN 2 THEN workout_schedule := ARRAY[2, 5]; -- Terça e sexta
    WHEN 3 THEN workout_schedule := ARRAY[1, 3, 5]; -- Segunda, quarta, sexta
    WHEN 4 THEN workout_schedule := ARRAY[1, 2, 4, 5]; -- Segunda, terça, quinta, sexta
    WHEN 5 THEN workout_schedule := ARRAY[1, 2, 3, 4, 5]; -- Segunda à sexta
    WHEN 6 THEN workout_schedule := ARRAY[1, 2, 3, 4, 5, 6]; -- Segunda ao sábado
    ELSE workout_schedule := ARRAY[1, 3, 5]; -- Padrão: 3x por semana
  END CASE;
  
  INSERT INTO system_logs (log_level, message) 
  VALUES ('INFO', 'PROGRAMAÇÃO SEMANAL: ' || array_to_string(workout_schedule, ',') || 
          ' para ' || total_workouts || ' treinos');
  
  -- Atualizar plano para aprovado
  UPDATE workout_plans_approval
  SET 
    status = 'approved',
    trainer_id = p_trainer_id,
    plan_payout = trainer_rate,
    updated_at = now()
  WHERE id = p_plan_id;
  
  -- Aprovar treinos existentes relacionados
  UPDATE daily_workouts
  SET 
    status = 'sent',
    approved_by = p_trainer_id,
    approved_at = now(),
    approval_status = 'approved'
  WHERE plan_id = p_plan_id
  AND user_id = user_id_target;
  
  GET DIAGNOSTICS affected_workouts = ROW_COUNT;
  
  -- ✅ CRIAR TREINOS FUTUROS PARA OS PRÓXIMOS 30 DIAS
  current_date_loop := CURRENT_DATE;
  day_counter := 0;
  
  WHILE day_counter < 30 LOOP
    current_date_loop := CURRENT_DATE + day_counter;
    current_day_of_week := EXTRACT(DOW FROM current_date_loop);
    
    -- DOMINGO SEMPRE É DESCANSO
    IF current_day_of_week = 0 THEN
      day_counter := day_counter + 1;
      CONTINUE;
    END IF;
    
    -- Verificar se é um dia de treino programado
    workout_index := array_position(workout_schedule, current_day_of_week);
    
    IF workout_index IS NOT NULL THEN
      -- Obter o treino específico do plano
      selected_workout := workout_days->(workout_index - 1);
      
      IF selected_workout IS NOT NULL THEN
        -- Verificar se já existe treino para esta data
        SELECT * INTO existing_workout_check
        FROM daily_workouts
        WHERE user_id = user_id_target 
        AND workout_date = current_date_loop;
        
        IF existing_workout_check IS NULL THEN
          -- Construir conteúdo do treino
          workout_content := '';
          FOR i IN 0..(jsonb_array_length(selected_workout->'exercises') - 1) LOOP
            workout_content := workout_content || 
              (i + 1) || '️⃣ ' || 
              (selected_workout->'exercises'->i->>'name') || ': ' ||
              (selected_workout->'exercises'->i->>'sets') || 'x' ||
              (selected_workout->'exercises'->i->>'reps') || ', Descanso: ' ||
              (selected_workout->'exercises'->i->>'rest') || E'\n';
          END LOOP;
          
          -- Criar novo treino futuro
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
            selected_workout->>'title',
            workout_content,
            'sent',
            'approved',
            p_trainer_id,
            now(),
            p_plan_id
          );
          
          future_workouts_created := future_workouts_created + 1;
          
          INSERT INTO system_logs (log_level, message) 
          VALUES ('SUCCESS', 'TREINO FUTURO CRIADO: ' || current_date_loop || 
                  ' (' || CASE current_day_of_week 
                    WHEN 1 THEN 'Segunda'
                    WHEN 2 THEN 'Terça' 
                    WHEN 3 THEN 'Quarta'
                    WHEN 4 THEN 'Quinta'
                    WHEN 5 THEN 'Sexta'
                    WHEN 6 THEN 'Sábado'
                  END || ') - ' || (selected_workout->>'title'));
        END IF;
      END IF;
    END IF;
    
    day_counter := day_counter + 1;
  END LOOP;
  
  -- Log final
  INSERT INTO system_logs (log_level, message) 
  VALUES ('SUCCESS', 'APROVAÇÃO EM CASCATA CONCLUÍDA: Plano ' || p_plan_id || 
          ', Treinos existentes aprovados: ' || affected_workouts || 
          ', Treinos futuros criados: ' || future_workouts_created);
  
  RETURN json_build_object(
    'success', true,
    'plan_payout', trainer_rate,
    'workouts_updated', affected_workouts,
    'future_workouts_created', future_workouts_created,
    'message', 'Plano aprovado com treinos futuros criados automaticamente'
  );
END;
$$;

-- ✅ ATUALIZAR A FUNÇÃO ORIGINAL PARA USAR A NOVA VERSÃO
CREATE OR REPLACE FUNCTION public.approve_workout_plan(p_plan_id uuid, p_trainer_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Chamar a nova função com criação de treinos futuros
  RETURN approve_workout_plan_with_future_workouts(p_plan_id, p_trainer_id);
END;
$$;