-- AÇÃO 1: Preparar o Banco de Dados para Gamificação

-- Adicionar coluna de pontos na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN points INTEGER NOT NULL DEFAULT 0;

-- Criar tabela de conquistas/medalhas
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_url TEXT,
  points_reward INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela achievements
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Política para visualizar todas as conquistas
CREATE POLICY "Everyone can view achievements" 
ON public.achievements 
FOR SELECT 
USING (true);

-- Apenas admins podem gerenciar conquistas
CREATE POLICY "Admins can manage achievements" 
ON public.achievements 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Criar tabela de conquistas do usuário
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Habilitar RLS na tabela user_achievements
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver suas próprias conquistas
CREATE POLICY "Users can view their own achievements" 
ON public.user_achievements 
FOR SELECT 
USING (auth.uid() = user_id);

-- Usuários podem inserir suas próprias conquistas (via triggers/functions)
CREATE POLICY "Users can insert their own achievements" 
ON public.user_achievements 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Personal trainers e admins podem ver todas as conquistas
CREATE POLICY "Trainers can view all user achievements" 
ON public.user_achievements 
FOR SELECT 
USING (is_personal_trainer() OR has_role(auth.uid(), 'admin'::app_role));

-- Inserir algumas conquistas básicas
INSERT INTO public.achievements (name, description, icon_url, points_reward) VALUES
('Primeiro Treino', 'Complete seu primeiro treino!', '🏃‍♂️', 100),
('Sequência de 3 Dias', 'Complete treinos por 3 dias seguidos', '🔥', 150),
('Sequência de 7 Dias', 'Complete treinos por uma semana inteira', '⭐', 300),
('Sequência de 30 Dias', 'Complete treinos por 30 dias seguidos', '👑', 1000),
('10 Treinos Completos', 'Complete 10 treinos no total', '💪', 200),
('50 Treinos Completos', 'Complete 50 treinos no total', '🏆', 500),
('100 Treinos Completos', 'Complete 100 treinos no total', '🥇', 1000),
('Madrugador', 'Complete um treino antes das 7h da manhã', '🌅', 100),
('Guerreiro de Fim de Semana', 'Complete treinos no sábado e domingo', '⚔️', 200);

-- Função para verificar e conceder conquistas automaticamente
CREATE OR REPLACE FUNCTION public.check_and_award_achievements(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  completed_workouts INTEGER;
  current_streak INTEGER;
  achievement_record RECORD;
  workout_times TIME[];
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
  VALUES ('INFO', 'Verificando conquistas para usuário: ' || p_user_id || 
          ', Treinos completos: ' || completed_workouts || 
          ', Sequência atual: ' || current_streak);
  
  -- Verificar conquista "Primeiro Treino"
  IF completed_workouts >= 1 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    SELECT p_user_id, id FROM achievements WHERE name = 'Primeiro Treino'
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
  END IF;
  
  -- Verificar conquista "10 Treinos Completos"
  IF completed_workouts >= 10 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    SELECT p_user_id, id FROM achievements WHERE name = '10 Treinos Completos'
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
  END IF;
  
  -- Verificar conquista "50 Treinos Completos"
  IF completed_workouts >= 50 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    SELECT p_user_id, id FROM achievements WHERE name = '50 Treinos Completos'
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
  END IF;
  
  -- Verificar conquista "100 Treinos Completos"
  IF completed_workouts >= 100 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    SELECT p_user_id, id FROM achievements WHERE name = '100 Treinos Completos'
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
  END IF;
  
  -- Verificar conquistas de sequência
  IF current_streak >= 3 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    SELECT p_user_id, id FROM achievements WHERE name = 'Sequência de 3 Dias'
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
  END IF;
  
  IF current_streak >= 7 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    SELECT p_user_id, id FROM achievements WHERE name = 'Sequência de 7 Dias'
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
  END IF;
  
  IF current_streak >= 30 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    SELECT p_user_id, id FROM achievements WHERE name = 'Sequência de 30 Dias'
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
  END IF;
  
  -- Log final
  INSERT INTO system_logs (log_level, message) 
  VALUES ('INFO', 'Verificação de conquistas concluída para usuário: ' || p_user_id);
  
END;
$$;

-- Função para adicionar pontos e verificar conquistas quando treino é concluído
CREATE OR REPLACE FUNCTION public.award_points_and_check_achievements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  points_to_award INTEGER := 50; -- Pontos por treino concluído
  bonus_points INTEGER := 0;
BEGIN
  -- Verificar se o status mudou para 'completed'
  IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
    
    -- Adicionar pontos base por treino concluído
    UPDATE profiles 
    SET points = points + points_to_award,
        updated_at = now()
    WHERE id = NEW.user_id;
    
    -- Log da adição de pontos
    INSERT INTO system_logs (log_level, message) 
    VALUES ('INFO', 'Adicionados ' || points_to_award || ' pontos para usuário: ' || NEW.user_id || ' por treino concluído');
    
    -- Verificar e conceder conquistas
    PERFORM check_and_award_achievements(NEW.user_id);
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para executar a função quando daily_workout é atualizado
CREATE TRIGGER trigger_award_points_and_achievements
AFTER UPDATE ON daily_workouts
FOR EACH ROW
EXECUTE FUNCTION award_points_and_check_achievements();

-- Trigger para update timestamp em achievements
CREATE TRIGGER update_achievements_updated_at
BEFORE UPDATE ON public.achievements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();