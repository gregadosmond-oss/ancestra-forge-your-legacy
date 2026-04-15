CREATE TABLE public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_session_id text NOT NULL UNIQUE,
  stripe_customer_id text,
  amount_total integer,
  currency text,
  status text NOT NULL DEFAULT 'unpaid',
  environment text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX idx_purchases_stripe_session ON public.purchases(stripe_session_id);

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases"
  ON public.purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage purchases"
  ON public.purchases FOR ALL
  USING ((SELECT auth.role()) = 'service_role');

CREATE TRIGGER update_purchases_updated_at
  BEFORE UPDATE ON public.purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();