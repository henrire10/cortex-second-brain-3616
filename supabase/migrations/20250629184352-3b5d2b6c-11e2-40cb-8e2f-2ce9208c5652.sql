
-- Inserir o usuário como personal trainer na tabela admin_users
-- Primeiro verificamos se já existe, se não existe, inserimos
INSERT INTO public.admin_users (user_id, email, role)
SELECT 
  au.id,
  'henrire007@gmail.com',
  'personal_trainer'::app_role
FROM auth.users au
WHERE au.email = 'henrire007@gmail.com'
AND NOT EXISTS (
  SELECT 1 
  FROM public.admin_users 
  WHERE user_id = au.id
);

-- Se já existe um registro, atualizamos o role
UPDATE public.admin_users 
SET role = 'personal_trainer'::app_role
WHERE user_id IN (
  SELECT id 
  FROM auth.users 
  WHERE email = 'henrire007@gmail.com'
);
