-- Adicionar colunas para sistema de sequência de treinos
ALTER TABLE public.profiles 
ADD COLUMN current_workout_streak integer NOT NULL DEFAULT 0,
ADD COLUMN last_workout_date date;

-- Criar edge function para atualizar sequência
CREATE OR REPLACE FUNCTION public.update_workout_streak_logic(p_user_id uuid, p_workout_date date)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_streak integer;
  last_date date;
  new_streak integer;
  date_diff integer;
BEGIN
  -- Buscar dados atuais do usuário
  SELECT current_workout_streak, last_workout_date 
  INTO current_streak, last_date
  FROM public.profiles 
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'User not found');
  END IF;
  
  -- Calcular diferença em dias
  IF last_date IS NULL THEN
    date_diff := 0; -- Primeiro treino
  ELSE
    date_diff := p_workout_date - last_date;
  END IF;
  
  -- Lógica da sequência
  IF last_date IS NULL OR date_diff = 1 THEN
    -- Primeiro treino ou dia consecutivo: incrementar
    new_streak := current_streak + 1;
  ELSIF date_diff > 1 THEN
    -- Mais de 1 dia: resetar sequência
    new_streak := 1;
  ELSIF date_diff = 0 THEN
    -- Mesmo dia: manter sequência
    new_streak := current_streak;
  ELSE
    -- Data anterior: não alterar
    new_streak := current_streak;
  END IF;
  
  -- Atualizar apenas se necessário
  IF date_diff != 0 OR last_date IS NULL THEN
    UPDATE public.profiles 
    SET 
      current_workout_streak = new_streak,
      last_workout_date = p_workout_date,
      updated_at = now()
    WHERE id = p_user_id;
    
    -- Log da atualização
    INSERT INTO public.system_logs (log_level, message) 
    VALUES ('INFO', 'Workout streak updated: User ' || p_user_id || 
            ', Date: ' || p_workout_date || 
            ', Old streak: ' || current_streak || 
            ', New streak: ' || new_streak);
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'old_streak', current_streak,
    'new_streak', new_streak,
    'date_diff', date_diff
  );
END;
$$;

-- Criar trigger para atualizar sequência automaticamente
CREATE OR REPLACE FUNCTION public.trigger_update_workout_streak()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o status mudou para 'completed'
  IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
    -- Chamar função de atualização da sequência
    PERFORM public.update_workout_streak_logic(NEW.user_id, NEW.workout_date);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Aplicar o trigger na tabela daily_workouts
DROP TRIGGER IF EXISTS workout_streak_trigger ON public.daily_workouts;
CREATE TRIGGER workout_streak_trigger
  AFTER UPDATE ON public.daily_workouts
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_workout_streak();