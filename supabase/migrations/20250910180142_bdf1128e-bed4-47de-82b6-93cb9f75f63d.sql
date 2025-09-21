-- Atualizar tabela profiles para suporte a assinaturas
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'trial', 'active', 'past_due', 'cancelled')),
ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS plan_id TEXT;

-- Atualizar tabela products para os planos de assinatura
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS price_real_monthly NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS price_real_total NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS duration_months INTEGER DEFAULT 1;

-- Inserir os 3 planos de assinatura
INSERT INTO public.products (name, description, price_real, price_points, price_real_monthly, price_real_total, duration_months, product_type, is_active) VALUES
('Plano Mensal', 'Acesso completo ao BetzaFit por 1 mês. Treinos personalizados, nutrição e evolução completos.', 79.99, 0, 79.99, 79.99, 1, 'subscription', true),
('Plano Trimestral', 'Acesso completo ao BetzaFit por 3 meses. Economia de R$ 30 comparado ao plano mensal.', 209.97, 0, 69.99, 209.97, 3, 'subscription', true),
('Plano Anual', 'Acesso completo ao BetzaFit por 12 meses. Economia de R$ 300 - Mais Popular!', 659.88, 0, 54.99, 659.88, 12, 'subscription', true)
ON CONFLICT DO NOTHING;