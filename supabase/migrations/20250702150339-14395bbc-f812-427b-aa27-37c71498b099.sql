
-- Corrigir dados inconsistentes na tabela profiles
-- Atualizar registros onde user_id está null para usar o valor do campo id
UPDATE profiles 
SET user_id = id 
WHERE user_id IS NULL;

-- Garantir que user_id não seja mais null no futuro
ALTER TABLE profiles 
ALTER COLUMN user_id SET NOT NULL;

-- Adicionar constraint para garantir consistência
ALTER TABLE profiles 
ADD CONSTRAINT profiles_user_id_matches_id 
CHECK (user_id = id);
