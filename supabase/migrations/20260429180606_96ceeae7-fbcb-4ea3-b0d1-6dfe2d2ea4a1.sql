CREATE TABLE public.journey_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  surname_searched text,
  source text NOT NULL DEFAULT 'journey-gate',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.journey_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe to journey"
ON public.journey_subscribers
FOR INSERT
TO anon, authenticated
WITH CHECK (true);