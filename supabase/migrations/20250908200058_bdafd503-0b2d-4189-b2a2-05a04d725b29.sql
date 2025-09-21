-- Add product_type column to products table
ALTER TABLE public.products ADD COLUMN product_type TEXT DEFAULT 'physical';

-- Create user_active_services table for digital service subscriptions
CREATE TABLE public.user_active_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for user_active_services
ALTER TABLE public.user_active_services ENABLE ROW LEVEL SECURITY;

-- Create policies for user_active_services
CREATE POLICY "Users can view their own active services"
ON public.user_active_services
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own active services"
ON public.user_active_services
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own active services"
ON public.user_active_services
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own active services"
ON public.user_active_services
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can manage all active services
CREATE POLICY "Admins can manage all active services"
ON public.user_active_services
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert the Calorie Bot product
INSERT INTO public.products (
  name,
  description,
  image_url,
  price_real,
  price_points,
  product_type,
  is_active,
  stock_quantity
) VALUES (
  'Módulo de Nutrição: Robô de Calorias',
  'Envie uma foto da sua refeição no WhatsApp e a nossa IA calcula as calorias para si. Válido por 30 dias.',
  '🧠',
  19.99,
  7000,
  'digital',
  true,
  999
);