
BEGIN;

-- Cria a tabela se ainda não existir (estrutura mínima)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  fcm_token text UNIQUE,
  platform text NOT NULL DEFAULT 'web',
  is_active boolean NOT NULL DEFAULT true,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Garante novas colunas mesmo se a tabela já existia
ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS fcm_token text,
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS platform text DEFAULT 'web',
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Índices úteis
CREATE UNIQUE INDEX IF NOT EXISTS idx_push_subscriptions_fcm_token
  ON public.push_subscriptions (fcm_token);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id
  ON public.push_subscriptions (user_id);

-- Trigger de updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_push_subscriptions_updated_at'
  ) THEN
    CREATE TRIGGER trg_push_subscriptions_updated_at
    BEFORE UPDATE ON public.push_subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END$$;

-- Trigger para preencher user_id = auth.uid() quando ausente
CREATE OR REPLACE FUNCTION public.set_user_id_on_push_subscription()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_push_subscriptions_set_user_id'
  ) THEN
    CREATE TRIGGER trg_push_subscriptions_set_user_id
    BEFORE INSERT ON public.push_subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.set_user_id_on_push_subscription();
  END IF;
END$$;

-- Ativa RLS e políticas mínimas
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='push_subscriptions' 
      AND policyname='Users can select own push_subscriptions or admin'
  ) THEN
    CREATE POLICY "Users can select own push_subscriptions or admin"
      ON public.push_subscriptions
      FOR SELECT
      USING (auth.uid() = user_id OR public.is_admin_user());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='push_subscriptions' 
      AND policyname='Users can insert own push_subscriptions'
  ) THEN
    CREATE POLICY "Users can insert own push_subscriptions"
      ON public.push_subscriptions
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='push_subscriptions' 
      AND policyname='Users can update own push_subscriptions or admin'
  ) THEN
    CREATE POLICY "Users can update own push_subscriptions or admin"
      ON public.push_subscriptions
      FOR UPDATE
      USING (auth.uid() = user_id OR public.is_admin_user())
      WITH CHECK (auth.uid() = user_id OR public.is_admin_user());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='push_subscriptions' 
      AND policyname='Users can delete own push_subscriptions or admin'
  ) THEN
    CREATE POLICY "Users can delete own push_subscriptions or admin"
      ON public.push_subscriptions
      FOR DELETE
      USING (auth.uid() = user_id OR public.is_admin_user());
  END IF;
END$$;

COMMIT;
