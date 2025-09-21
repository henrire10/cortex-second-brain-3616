-- Garantir que o bucket avatars existe e está público
DO $$
BEGIN
  -- Criar bucket se não existir
  INSERT INTO storage.buckets (id, name, public) 
  VALUES ('avatars', 'avatars', true)
  ON CONFLICT (id) DO UPDATE SET public = true;
  
  -- Log da criação
  INSERT INTO system_logs (log_level, message) 
  VALUES ('INFO', 'STORAGE: Bucket avatars verificado/criado com acesso público');
END$$;

-- Política para permitir SELECT (visualização) para todos
CREATE POLICY IF NOT EXISTS "Anyone can view avatars" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

-- Política para permitir INSERT (upload) para usuários autenticados
CREATE POLICY IF NOT EXISTS "Users can upload their own avatar" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para permitir UPDATE para o próprio usuário
CREATE POLICY IF NOT EXISTS "Users can update their own avatar" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para permitir DELETE para o próprio usuário
CREATE POLICY IF NOT EXISTS "Users can delete their own avatar" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Log das políticas criadas
INSERT INTO system_logs (log_level, message) 
VALUES ('SUCCESS', 'STORAGE: Políticas do bucket avatars configuradas com sucesso');