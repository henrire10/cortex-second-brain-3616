
-- AÇÃO 1: Criar o controle de acesso para Personal Trainer

-- 1. Atualizar o enum de roles para incluir personal_trainer
DROP TYPE IF EXISTS public.app_role CASCADE;
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'personal_trainer');

-- 2. Recriar a tabela admin_users com o novo enum
DROP TABLE IF EXISTS public.admin_users CASCADE;
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Criar função de verificação de role atualizada
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. Criar função para verificar se é personal trainer
CREATE OR REPLACE FUNCTION public.is_personal_trainer()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.admin_users 
    WHERE user_id = auth.uid() 
    AND role = 'personal_trainer'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$;

-- 5. Atualizar tabela daily_workouts para incluir status de aprovação
ALTER TABLE public.daily_workouts 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending_approval',
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS personal_notes TEXT;

-- 6. Atualizar os status existentes para o novo fluxo
UPDATE public.daily_workouts 
SET approval_status = 'pending_approval' 
WHERE status = 'pending';

-- 7. Criar view para treinos aguardando aprovação com dados do cliente
CREATE OR REPLACE VIEW public.workouts_pending_approval AS
SELECT 
    dw.id,
    dw.user_id,
    dw.workout_date,
    dw.workout_title,
    dw.workout_content,
    dw.approval_status,
    p.name as user_name,
    p.email as user_email,
    p.fitness_goal,
    p.age,
    p.gender,
    p.experience_level,
    uw.phone_number
FROM public.daily_workouts dw
JOIN public.profiles p ON dw.user_id = p.id
LEFT JOIN public.user_whatsapp uw ON dw.user_id = uw.user_id
WHERE dw.approval_status = 'pending_approval'
ORDER BY dw.created_at ASC;

-- 8. Habilitar RLS nas tabelas necessárias
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 9. Criar políticas RLS para admin_users
CREATE POLICY "Users can view their own admin record" 
  ON public.admin_users 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all admin records" 
  ON public.admin_users 
  FOR SELECT 
  USING (public.has_role(auth.uid(), 'admin'));

-- 10. Criar políticas para personal trainers acessarem treinos
CREATE POLICY "Personal trainers can view pending workouts" 
  ON public.daily_workouts 
  FOR ALL
  USING (public.is_personal_trainer() OR public.has_role(auth.uid(), 'admin'));

-- 11. Criar trigger para atualizar updated_at
CREATE OR REPLACE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
