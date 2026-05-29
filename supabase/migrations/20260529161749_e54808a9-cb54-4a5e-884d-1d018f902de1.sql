CREATE TABLE public.personal_legacy_stories (
  user_id uuid PRIMARY KEY,
  signature text NOT NULL,
  chapters jsonb NOT NULL,
  model text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.personal_legacy_stories TO authenticated;
GRANT ALL ON public.personal_legacy_stories TO service_role;

ALTER TABLE public.personal_legacy_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own personal story"
ON public.personal_legacy_stories
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);