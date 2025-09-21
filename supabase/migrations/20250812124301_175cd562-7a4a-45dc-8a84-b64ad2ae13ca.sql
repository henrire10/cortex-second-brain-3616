
-- Criar tabela para atividades ao ar livre
CREATE TABLE public.outdoor_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL CHECK (type IN ('corrida', 'caminhada')),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  distance_km NUMERIC(8,3) DEFAULT 0,
  duration_minutes INTEGER DEFAULT 0,
  avg_speed_kmh NUMERIC(5,2) DEFAULT 0,
  calories_burned INTEGER DEFAULT 0,
  route_path JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela
ALTER TABLE public.outdoor_activities ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas suas próprias atividades
CREATE POLICY "Users can view their own activities" 
  ON public.outdoor_activities 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Política para permitir que usuários criem suas próprias atividades
CREATE POLICY "Users can create their own activities" 
  ON public.outdoor_activities 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Política para permitir que usuários atualizem suas próprias atividades
CREATE POLICY "Users can update their own activities" 
  ON public.outdoor_activities 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Política para permitir que usuários deletem suas próprias atividades
CREATE POLICY "Users can delete their own activities" 
  ON public.outdoor_activities 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Trigger para atualizar o campo updated_at automaticamente
CREATE TRIGGER update_outdoor_activities_updated_at
  BEFORE UPDATE ON public.outdoor_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
