-- Corrigir a função handle_new_user para resolver o erro de user_id NULL
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Inserir na tabela profiles com user_id preenchido corretamente
  INSERT INTO public.profiles (id, user_id, name, email, created_at, updated_at)
  VALUES (
    new.id,
    new.id,  -- user_id deve ser igual ao id do usuário
    COALESCE(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email,
    now(),
    now()
  );
  
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Log do erro para debugging
  INSERT INTO public.system_logs (log_level, message)
  VALUES ('ERROR', 'Erro ao criar perfil para usuário ' || new.id || ': ' || SQLERRM);
  
  -- Retornar new mesmo com erro para não bloquear o signup
  RETURN new;
END;
$$;

-- Recriar o trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();