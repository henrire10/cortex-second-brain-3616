
-- Primeiro, remover a coluna que foi criada incorretamente
ALTER TABLE public.profiles DROP COLUMN IF EXISTS profile_status;

-- Criar o tipo enum primeiro
DROP TYPE IF EXISTS public.profile_status_enum;
CREATE TYPE public.profile_status_enum AS ENUM (
  'iniciando_questionario',
  'questionario_concluido', 
  'treino_gerado'
);

-- Adicionar a coluna já com o tipo enum e valor padrão correto
ALTER TABLE public.profiles 
ADD COLUMN profile_status profile_status_enum NOT NULL DEFAULT 'iniciando_questionario';

-- Atualizar usuários existentes que já completaram o questionário
UPDATE public.profiles 
SET profile_status = 'questionario_concluido' 
WHERE questionnaire_completed = true;

-- Atualizar usuários que já têm treinos gerados
UPDATE public.profiles p
SET profile_status = 'treino_gerado'
FROM workout_plans wp
WHERE p.id = wp.user_id 
AND wp.is_active = true
AND p.profile_status = 'questionario_concluido';
