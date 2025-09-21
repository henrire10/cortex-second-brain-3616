-- 🔧 CORREÇÃO CRÍTICA: Função de aprovação corrigida para evitar sobrecarga do personal trainer
-- PROBLEMA: Estava criando treinos futuros como 'pending_approval', sobrecarregando o painel
-- SOLUÇÃO: Treinos futuros são criados como automaticamente aprovados

CREATE OR REPLACE FUNCTION public.approve_workout_plan_with_future_workouts_30_days_fixed(p_plan_id uuid, p_trainer_id uuid)
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
  VALUES ('INFO', '🚀 APROVAÇÃO CORRIGIDA: Iniciando para plano ' || p_plan_id || 
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
  VALUES ('INFO', '📅 PROGRAMAÇÃO CORRIGIDA: ' || array_to_string(workout_schedule, ',') || 
          ' para ' || total_workouts || ' treinos');
  
  -- ✅ ETAPA 1: Atualizar plano para aprovado
  UPDATE workout_plans_approval
  SET 
    status = 'approved',
    trainer_id = p_trainer_id,
    plan_payout = trainer_rate,
    updated_at = now()
  WHERE id = p_plan_id;
  
  -- ✅ ETAPA 2: Aprovar treinos EXISTENTES da primeira semana (que estavam pending_approval)
  UPDATE daily_workouts
  SET 
    status = 'sent',
    approved_by = p_trainer_id,
    approved_at = now(),
    approval_status = 'approved'
  WHERE plan_id = p_plan_id
  AND user_id = user_id_target
  AND approval_status = 'pending_approval';
  
  GET DIAGNOSTICS affected_workouts = ROW_COUNT;
  
  INSERT INTO system_logs (log_level, message) 
  VALUES ('SUCCESS', '✅ PRIMEIRA SEMANA APROVADA: ' || affected_workouts || ' treinos aprovados pelo personal trainer');
  
  -- ✅ ETAPA 3: CRIAR TREINOS FUTUROS COMO **AUTOMATICAMENTE APROVADOS** (SEM PRECISAR DE NOVA APROVAÇÃO)
  current_date_loop := CURRENT_DATE;
  day_counter := 0;
  
  -- Loop pelos próximos 30 dias
  WHILE day_counter < 30 LOOP
    current_date_loop := CURRENT_DATE + day_counter;
    current_day_of_week := EXTRACT(DOW FROM current_date_loop);
    
    -- DOMINGO SEMPRE É DESCANSO - PULAR
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
          
          -- 🔥 CORREÇÃO CRÍTICA: Criar treino futuro como AUTOMATICAMENTE APROVADO
          -- NÃO ENVIAR PARA NOVA APROVAÇÃO DO PERSONAL TRAINER
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
            'sent',                    -- Status: pronto para envio
            'approved',               -- AUTOMATICAMENTE APROVADO
            p_trainer_id,             -- Aprovado pelo mesmo personal trainer
            now(),                    -- Aprovado agora
            p_plan_id                 -- Vinculado ao mesmo plano
          );
          
          future_workouts_created := future_workouts_created + 1;
          
          INSERT INTO system_logs (log_level, message) 
          VALUES ('SUCCESS', '✅ TREINO FUTURO AUTO-APROVADO: ' || current_date_loop || 
                  ' (' || CASE current_day_of_week 
                    WHEN 1 THEN 'Segunda'
                    WHEN 2 THEN 'Terça' 
                    WHEN 3 THEN 'Quarta'
                    WHEN 4 THEN 'Quinta'
                    WHEN 5 THEN 'Sexta'
                    WHEN 6 THEN 'Sábado'
                  END || ') - ' || (selected_workout->>'title'));
        ELSE
          -- Se já existe, garantir que está aprovado
          UPDATE daily_workouts
          SET 
            status = 'sent',
            approval_status = 'approved',
            approved_by = p_trainer_id,
            approved_at = now(),
            plan_id = p_plan_id
          WHERE id = existing_workout_check.id
          AND approval_status != 'approved';
          
          affected_workouts := affected_workouts + 1;
        END IF;
      END IF;
    END IF;
    
    day_counter := day_counter + 1;
  END LOOP;
  
  -- Log final
  INSERT INTO system_logs (log_level, message) 
  VALUES ('SUCCESS', '🎉 APROVAÇÃO CORRIGIDA CONCLUÍDA: Plano ' || p_plan_id || 
          ', Primeira semana aprovada: ' || affected_workouts || 
          ', Treinos futuros auto-aprovados: ' || future_workouts_created || 
          ', TOTAL 30 dias processados - SEM SOBRECARGA NO PAINEL');
  
  RETURN json_build_object(
    'success', true,
    'plan_payout', trainer_rate,
    'first_week_approved', affected_workouts,
    'future_workouts_auto_approved', future_workouts_created,
    'total_days_processed', 30,
    'message', 'CORREÇÃO APLICADA: Apenas primeira semana precisa aprovação, treinos futuros são automaticamente aprovados'
  );
END;
$function$;

-- Atualizar a função principal para usar a versão corrigida
CREATE OR REPLACE FUNCTION public.approve_workout_plan(p_plan_id uuid, p_trainer_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Usar a nova função corrigida
  RETURN approve_workout_plan_with_future_workouts_30_days_fixed(p_plan_id, p_trainer_id);
END;
$function$;