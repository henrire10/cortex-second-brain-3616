
-- Inserir o usuário hick@gmail.com como administrador na tabela admin_users
-- Primeiro verificamos se já existe, se não existe, inserimos
INSERT INTO public.admin_users (user_id, email, role)
SELECT 
  au.id,
  'hick@gmail.com',
  'admin'::app_role
FROM auth.users au
WHERE au.email = 'hick@gmail.com'
AND NOT EXISTS (
  SELECT 1 
  FROM public.admin_users 
  WHERE user_id = au.id
);

-- Se já existe um registro, atualizamos o role para admin
UPDATE public.admin_users 
SET role = 'admin'::app_role
WHERE user_id IN (
  SELECT id 
  FROM auth.users 
  WHERE email = 'hick@gmail.com'
);
