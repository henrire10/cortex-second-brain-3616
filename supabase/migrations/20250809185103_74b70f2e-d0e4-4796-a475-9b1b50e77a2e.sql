-- Create table for Web Push API subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  expiration_time TIMESTAMPTZ,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_endpoint UNIQUE (endpoint)
);

-- Index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id
  ON public.push_subscriptions (user_id);

-- Enable Row Level Security
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies: users can manage only their own subscriptions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'push_subscriptions' AND policyname = 'Users can view their subscriptions'
  ) THEN
    CREATE POLICY "Users can view their subscriptions"
      ON public.push_subscriptions
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'push_subscriptions' AND policyname = 'Users can insert their subscriptions'
  ) THEN
    CREATE POLICY "Users can insert their subscriptions"
      ON public.push_subscriptions
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'push_subscriptions' AND policyname = 'Users can update their subscriptions'
  ) THEN
    CREATE POLICY "Users can update their subscriptions"
      ON public.push_subscriptions
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'push_subscriptions' AND policyname = 'Users can delete their subscriptions'
  ) THEN
    CREATE POLICY "Users can delete their subscriptions"
      ON public.push_subscriptions
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END$$;

-- Trigger to auto-update updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_push_subscriptions_updated_at'
  ) THEN
    CREATE TRIGGER update_push_subscriptions_updated_at
      BEFORE UPDATE ON public.push_subscriptions
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END$$;