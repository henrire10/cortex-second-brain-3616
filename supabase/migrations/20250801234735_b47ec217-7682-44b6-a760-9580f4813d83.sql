-- Criar tabela workout_logs para registrar performance dos exercícios
CREATE TABLE public.workout_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  daily_workout_id UUID REFERENCES public.daily_workouts(id),
  exercise_name TEXT NOT NULL,
  set_number INTEGER NOT NULL,
  weight_lifted NUMERIC(6,2) NOT NULL,
  reps_performed INTEGER NOT NULL,
  logged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Users can view their own workout logs" 
ON public.workout_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workout logs" 
ON public.workout_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout logs" 
ON public.workout_logs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout logs" 
ON public.workout_logs 
FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_workout_logs_updated_at
  BEFORE UPDATE ON public.workout_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_workout_logs_user_id ON public.workout_logs(user_id);
CREATE INDEX idx_workout_logs_exercise_name ON public.workout_logs(exercise_name);
CREATE INDEX idx_workout_logs_logged_at ON public.workout_logs(logged_at);