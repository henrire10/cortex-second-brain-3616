-- Criar bucket para fotos de progresso
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('progress-photos', 'progress-photos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']);

-- Criar políticas para o bucket progress-photos
CREATE POLICY "Users can view progress photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'progress-photos');

CREATE POLICY "Users can upload their own progress photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own progress photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own progress photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);