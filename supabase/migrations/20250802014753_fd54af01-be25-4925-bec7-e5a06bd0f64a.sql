
-- AUDITORIA E CORREÇÃO DEFINITIVA: Limpar dados incorretos e implementar validação

-- 1. AUDITORIA: Identificar todos os treinos futuros incorretos
-- Verificar dados problemáticos que causam a distribuição errada
SELECT 
    workout_date,
    workout_title,
    EXTRACT(DOW FROM workout_date) as day_of_week,
    CASE EXTRACT(DOW FROM workout_date)
        WHEN 0 THEN 'Domingo - ERRO! Deveria ser descanso'
        WHEN 1 THEN 'Segunda - Deveria ser Treino A'
        WHEN 2 THEN 'Terça - Deveria ser Treino B'  
        WHEN 3 THEN 'Quarta - Deveria ser Treino C'
        WHEN 4 THEN 'Quinta - Deveria ser Treino D'
        WHEN 5 THEN 'Sexta - Deveria ser Treino E'
        WHEN 6 THEN 'Sábado - Deveria ser descanso'
    END as expected_workout,
    user_id
FROM daily_workouts 
WHERE workout_date >= CURRENT_DATE
AND approval_status = 'pending_approval'
ORDER BY workout_date;

-- 2. LIMPEZA TOTAL: Deletar TODOS os treinos futuros incorretos
DELETE FROM daily_workouts 
WHERE workout_date >= CURRENT_DATE
AND approval_status = 'pending_approval';

-- 3. VALIDAÇÃO: Criar trigger para impedir criação de treinos incorretos
-- Garantir que nunca mais sejam criados treinos com distribuição errada
CREATE OR REPLACE FUNCTION validate_workout_distribution()
RETURNS TRIGGER AS $$
DECLARE
    day_of_week INTEGER;
    expected_workout_letter CHAR(1);
    actual_workout_letter CHAR(1);
BEGIN
    -- Calcular dia da semana (0=Domingo, 1=Segunda, etc.)
    day_of_week := EXTRACT(DOW FROM NEW.workout_date);
    
    -- Domingo (0) nunca deve ter treino
    IF day_of_week = 0 THEN
        RAISE EXCEPTION 'ERRO CRÍTICO: Tentativa de criar treino no domingo (%). Domingo é descanso obrigatório!', NEW.workout_date;
    END IF;
    
    -- Calcular letra esperada do treino baseada no dia da semana
    -- Segunda(1)=A, Terça(2)=B, Quarta(3)=C, Quinta(4)=D, Sexta(5)=E, Sábado(6)=Descanso
    CASE day_of_week
        WHEN 1 THEN expected_workout_letter := 'A';
        WHEN 2 THEN expected_workout_letter := 'B';
        WHEN 3 THEN expected_workout_letter := 'C';
        WHEN 4 THEN expected_workout_letter := 'D';
        WHEN 5 THEN expected_workout_letter := 'E';
        WHEN 6 THEN 
            -- Sábado pode ser descanso ou treino F dependendo do plano
            -- Por enquanto, permitir mas logar
            INSERT INTO system_logs (log_level, message) 
            VALUES ('WARN', 'Treino criado no sábado: ' || NEW.workout_title || ' para data ' || NEW.workout_date);
            RETURN NEW;
        ELSE 
            RAISE EXCEPTION 'Dia da semana inválido: %', day_of_week;
    END CASE;
    
    -- Extrair letra do treino atual (assumindo formato "Treino X")
    actual_workout_letter := UPPER(RIGHT(TRIM(NEW.workout_title), 1));
    
    -- Validar se a letra corresponde ao dia
    IF actual_workout_letter != expected_workout_letter THEN
        -- Log do erro antes de falhar
        INSERT INTO system_logs (log_level, message) 
        VALUES ('ERROR', 'DISTRIBUIÇÃO INCORRETA DETECTADA: ' || NEW.workout_date || 
                ' (' || CASE day_of_week 
                    WHEN 1 THEN 'Segunda'
                    WHEN 2 THEN 'Terça' 
                    WHEN 3 THEN 'Quarta'
                    WHEN 4 THEN 'Quinta'
                    WHEN 5 THEN 'Sexta'
                    WHEN 6 THEN 'Sábado'
                END || ') deveria ser Treino ' || expected_workout_letter || 
                ' mas está sendo criado como ' || NEW.workout_title);
        
        RAISE EXCEPTION 'DISTRIBUIÇÃO INCORRETA: % (%) deveria ter Treino %, mas está sendo criado %', 
            NEW.workout_date, 
            CASE day_of_week 
                WHEN 1 THEN 'Segunda'
                WHEN 2 THEN 'Terça' 
                WHEN 3 THEN 'Quarta'
                WHEN 4 THEN 'Quinta'
                WHEN 5 THEN 'Sexta'
                WHEN 6 THEN 'Sábado'
            END,
            expected_workout_letter,
            NEW.workout_title;
    END IF;
    
    -- Log do sucesso
    INSERT INTO system_logs (log_level, message) 
    VALUES ('SUCCESS', 'Treino criado CORRETAMENTE: ' || NEW.workout_date || 
            ' (' || CASE day_of_week 
                WHEN 1 THEN 'Segunda'
                WHEN 2 THEN 'Terça' 
                WHEN 3 THEN 'Quarta'
                WHEN 4 THEN 'Quinta'
                WHEN 5 THEN 'Sexta'
                WHEN 6 THEN 'Sábado'
            END || ') = ' || NEW.workout_title);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. APLICAR TRIGGER na tabela daily_workouts
DROP TRIGGER IF EXISTS validate_workout_distribution_trigger ON daily_workouts;
CREATE TRIGGER validate_workout_distribution_trigger
    BEFORE INSERT ON daily_workouts
    FOR EACH ROW
    EXECUTE FUNCTION validate_workout_distribution();

-- 5. VERIFICAÇÃO FINAL: Mostrar estado atual limpo
SELECT 'Limpeza concluída - Verificando estado atual:' as status;
SELECT COUNT(*) as remaining_future_workouts 
FROM daily_workouts 
WHERE workout_date >= CURRENT_DATE;

-- 6. LOG DA CORREÇÃO
INSERT INTO system_logs (log_level, message) 
VALUES ('INFO', '🚀 CORREÇÃO DEFINITIVA APLICADA: Dados incorretos limpos, trigger de validação ativo');
