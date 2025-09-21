-- CORREÇÃO DO SISTEMA DE TREINOS: Remover validação rígida e permitir distribuição flexível

-- 1. Desabilitar o trigger problemático temporariamente
DROP TRIGGER IF EXISTS validate_workout_distribution_trigger ON daily_workouts;

-- 2. Criar função de validação flexível e inteligente
CREATE OR REPLACE FUNCTION public.validate_flexible_workout_distribution()
RETURNS TRIGGER AS $$
DECLARE
    day_of_week INTEGER;
    user_plan RECORD;
    workout_schedule INTEGER[];
    expected_workout_index INTEGER;
    actual_workout_letter CHAR(1);
    expected_workout_letter CHAR(1);
BEGIN
    -- VALIDAÇÃO CRÍTICA: Nunca permitir treinos no domingo
    day_of_week := EXTRACT(DOW FROM NEW.workout_date);
    IF day_of_week = 0 THEN
        RAISE EXCEPTION '🚫 ERRO CRÍTICO: Tentativa de criar treino no domingo (%). Domingo é dia de descanso obrigatório!', NEW.workout_date;
    END IF;
    
    -- Buscar o plano do usuário para entender a programação
    SELECT * INTO user_plan
    FROM workout_plans 
    WHERE user_id = NEW.user_id 
    AND is_active = true
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Se não tem plano, permitir (será validado em outro lugar)
    IF user_plan IS NULL THEN
        INSERT INTO system_logs (log_level, message) 
        VALUES ('WARN', 'Treino criado sem plano ativo para usuário: ' || NEW.user_id);
        RETURN NEW;
    END IF;
    
    -- Calcular programação baseada no número de treinos
    CASE jsonb_array_length(user_plan.plan_data->'workoutDays')
        WHEN 1 THEN workout_schedule := ARRAY[3]; -- Quarta
        WHEN 2 THEN workout_schedule := ARRAY[2, 5]; -- Terça e sexta
        WHEN 3 THEN workout_schedule := ARRAY[1, 3, 5]; -- Segunda, quarta, sexta
        WHEN 4 THEN workout_schedule := ARRAY[1, 2, 4, 5]; -- Segunda, terça, quinta, sexta
        WHEN 5 THEN workout_schedule := ARRAY[1, 2, 3, 4, 5]; -- Segunda à sexta
        WHEN 6 THEN workout_schedule := ARRAY[1, 2, 3, 4, 5, 6]; -- Segunda ao sábado
        ELSE workout_schedule := ARRAY[1, 3, 5]; -- Padrão: 3x por semana
    END CASE;
    
    -- Verificar se hoje é um dia válido na programação
    expected_workout_index := array_position(workout_schedule, day_of_week);
    
    IF expected_workout_index IS NULL THEN
        RAISE EXCEPTION 'DISTRIBUIÇÃO INCORRETA: % não é um dia de treino programado para este usuário (programação: %)', 
            NEW.workout_date, array_to_string(workout_schedule, ',');
    END IF;
    
    -- Extrair letra do treino (assumindo formato "Treino X - Descrição")
    actual_workout_letter := UPPER(substring(NEW.workout_title from 'Treino ([A-Z])'));
    
    -- Calcular letra esperada baseada no índice (A=1, B=2, C=3, D=4, E=5, F=6)
    expected_workout_letter := chr(64 + expected_workout_index); -- 64 + 1 = 65 = 'A'
    
    -- Validar correspondência
    IF actual_workout_letter != expected_workout_letter THEN
        INSERT INTO system_logs (log_level, message) 
        VALUES ('ERROR', 'DISTRIBUIÇÃO FLEXÍVEL INCORRETA: ' || NEW.workout_date || 
                ' deveria ser Treino ' || expected_workout_letter || 
                ' (posição ' || expected_workout_index || ' na programação) mas está sendo criado como ' || NEW.workout_title);
                
        RAISE EXCEPTION 'DISTRIBUIÇÃO FLEXÍVEL INCORRETA: % deveria ser Treino % (posição % na programação) mas está sendo criado como %', 
            NEW.workout_date, expected_workout_letter, expected_workout_index, NEW.workout_title;
    END IF;
    
    -- Log de sucesso
    INSERT INTO system_logs (log_level, message) 
    VALUES ('SUCCESS', 'Treino FLEXÍVEL criado CORRETAMENTE: ' || NEW.workout_date || 
            ' (posição ' || expected_workout_index || ' na programação) = ' || NEW.workout_title);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Criar o novo trigger flexível
CREATE TRIGGER validate_flexible_workout_distribution_trigger
BEFORE INSERT ON daily_workouts
FOR EACH ROW
EXECUTE FUNCTION validate_flexible_workout_distribution();

-- 4. Limpar treinos bloqueados e recriar
DELETE FROM daily_workouts 
WHERE user_id IN (
    SELECT DISTINCT user_id 
    FROM daily_workouts 
    WHERE workout_date >= CURRENT_DATE - INTERVAL '3 days'
    GROUP BY user_id, workout_date 
    HAVING COUNT(*) < 3 -- Usuários que têm menos treinos que o esperado
)
AND workout_date >= CURRENT_DATE - INTERVAL '3 days'
AND status = 'pending';

-- 5. Log da correção
INSERT INTO system_logs (log_level, message) 
VALUES ('INFO', '🔧 SISTEMA CORRIGIDO: Validação flexível implementada, treinos bloqueados removidos. Sistema pronto para recriar todos os treinos.');