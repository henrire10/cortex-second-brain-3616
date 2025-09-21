
-- Criar tabela para exercícios individuais concluídos
CREATE TABLE public.completed_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_date DATE NOT NULL,
  exercise_name TEXT NOT NULL,
  workout_title TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Constraint para evitar duplicatas do mesmo exercício no mesmo dia/treino
  UNIQUE(user_id, workout_date, exercise_name, workout_title)
);

-- Habilitar Row Level Security
ALTER TABLE public.completed_exercises ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para que usuários só vejam seus próprios exercícios
CREATE POLICY "Users can view their own completed exercises" 
  ON public.completed_exercises 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own completed exercises" 
  ON public.completed_exercises 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own completed exercises" 
  ON public.completed_exercises 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX idx_completed_exercises_user_date ON public.completed_exercises(user_id, workout_date);
CREATE INDEX idx_completed_exercises_user_workout ON public.completed_exercises(user_id, workout_title, workout_date);
