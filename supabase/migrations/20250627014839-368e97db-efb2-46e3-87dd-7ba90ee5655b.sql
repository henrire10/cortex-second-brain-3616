
-- AÇÃO PRIORITÁRIA 1: Corrigir a política RLS recursiva na tabela admin_users
-- O erro "infinite recursion detected in policy" está bloqueando operações no banco

-- Primeiro, remover todas as políticas existentes que podem estar causando recursão
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.admin_users;
DROP POLICY IF EXISTS "Admin access policy" ON public.admin_users;
DROP POLICY IF EXISTS "Users can view own admin status" ON public.admin_users;

-- Criar função security definer para verificar role de admin sem recursão
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
BEGIN
  -- Verificar diretamente na tabela admin_users sem usar RLS
  RETURN (
    SELECT role 
    FROM public.admin_users 
    WHERE user_id = auth.uid()
    LIMIT 1
  );
EXCEPTION WHEN OTHERS THEN
  RETURN 'user';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Criar função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.admin_users 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Recriar políticas RLS sem recursão
CREATE POLICY "Admins can manage admin_users" 
ON public.admin_users 
FOR ALL 
USING (public.is_admin_user());

CREATE POLICY "Users can view own admin status" 
ON public.admin_users 
FOR SELECT 
USING (auth.uid() = user_id);

-- Garantir que a tabela tenha RLS habilitado
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
