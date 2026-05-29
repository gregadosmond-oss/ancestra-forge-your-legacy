CREATE TABLE public.family_memory_chapters (
  user_id uuid NOT NULL PRIMARY KEY,
  prose text NOT NULL,
  signature text NOT NULL,
  model text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.family_memory_chapters TO authenticated;
GRANT ALL ON public.family_memory_chapters TO service_role;

ALTER TABLE public.family_memory_chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own memory chapter"
ON public.family_memory_chapters
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);