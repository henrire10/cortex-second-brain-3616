
-- Ação 1: Normalizar a Tabela profiles - Adicionar colunas dedicadas
-- Informações básicas
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS height NUMERIC,
ADD COLUMN IF NOT EXISTS weight NUMERIC;

-- Objetivos
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS fitness_goal TEXT,
ADD COLUMN IF NOT EXISTS specific_goal TEXT,
ADD COLUMN IF NOT EXISTS commitment_level TEXT;

-- Treino
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS experience_level TEXT,
ADD COLUMN IF NOT EXISTS workout_days_per_week INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS session_duration INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS available_equipment TEXT[], -- Array de equipamentos
ADD COLUMN IF NOT EXISTS exercise_preferences TEXT,
ADD COLUMN IF NOT EXISTS exercise_restrictions TEXT,
ADD COLUMN IF NOT EXISTS medical_conditions TEXT;

-- Estilo de vida
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS activity_level TEXT,
ADD COLUMN IF NOT EXISTS sleep_quality INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS average_sleep_hours NUMERIC DEFAULT 8,
ADD COLUMN IF NOT EXISTS stress_level INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS water_consumption TEXT;

-- Dieta
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS dietary_restrictions TEXT[], -- Array de restrições
ADD COLUMN IF NOT EXISTS allergies TEXT,
ADD COLUMN IF NOT EXISTS other_restrictions TEXT,
ADD COLUMN IF NOT EXISTS favorite_foods TEXT[], -- Array de alimentos favoritos
ADD COLUMN IF NOT EXISTS disliked_foods TEXT[], -- Array de alimentos não consumidos
ADD COLUMN IF NOT EXISTS meals_per_day INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS cooking_skill TEXT,
ADD COLUMN IF NOT EXISTS cooking_time TEXT,
ADD COLUMN IF NOT EXISTS supplements_interest TEXT[]; -- Array de suplementos

-- Adicionar comentário para indicar que profile_data JSONB está obsoleto
COMMENT ON COLUMN public.profiles.profile_data IS 'OBSOLETO: Usar colunas dedicadas ao invés deste JSONB';
