-- Criar bucket para GIFs de exercícios se não existir
INSERT INTO storage.buckets (id, name, public) 
VALUES ('exercise-media', 'exercise-media', true)
ON CONFLICT (id) DO NOTHING;

-- Política para visualizar GIFs (acesso público)
DROP POLICY IF EXISTS "GIFs são publicamente visíveis" ON storage.objects;
CREATE POLICY "GIFs são publicamente visíveis" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'exercise-media');

-- Política para upload de GIFs (apenas admins)
DROP POLICY IF EXISTS "Apenas admins podem fazer upload de GIFs" ON storage.objects;
CREATE POLICY "Apenas admins podem fazer upload de GIFs" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'exercise-media' AND auth.uid() IN (
  SELECT user_id FROM admin_users WHERE role = 'admin'
));

-- Política para gerenciar GIFs (apenas admins)
DROP POLICY IF EXISTS "Apenas admins podem gerenciar GIFs" ON storage.objects;
CREATE POLICY "Apenas admins podem gerenciar GIFs" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'exercise-media' AND auth.uid() IN (
  SELECT user_id FROM admin_users WHERE role = 'admin'
));

DROP POLICY IF EXISTS "Apenas admins podem deletar GIFs" ON storage.objects;
CREATE POLICY "Apenas admins podem deletar GIFs" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'exercise-media' AND auth.uid() IN (
  SELECT user_id FROM admin_users WHERE role = 'admin'
));