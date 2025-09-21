
-- Ação 1: Melhorar os Status do Perfil
-- Expandir o enum profile_status_enum para incluir os novos estados

-- Primeiro, remover a coluna existente
ALTER TABLE public.profiles DROP COLUMN IF EXISTS profile_status;

-- Remover o tipo enum antigo
DROP TYPE IF EXISTS public.profile_status_enum;

-- Criar o novo tipo enum com todos os estados necessários
CREATE TYPE public.profile_status_enum AS ENUM (
  'iniciando_questionario',
  'questionario_concluido', 
  'gerando_treino',
  'falha_na_geracao',
  'treino_gerado'
);

-- Adicionar a coluna novamente com o novo tipo enum
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
