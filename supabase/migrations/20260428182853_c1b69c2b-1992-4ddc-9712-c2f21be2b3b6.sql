CREATE TABLE public.book_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  surname text,
  source text NOT NULL DEFAULT 'shop',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX book_waitlist_email_unique ON public.book_waitlist (lower(email));

ALTER TABLE public.book_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert into book_waitlist"
  ON public.book_waitlist
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Only service role can read book_waitlist"
  ON public.book_waitlist
  FOR SELECT
  TO service_role
  USING (true);