CREATE TABLE public.family_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  relative_name text NOT NULL,
  relationship text NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_memories TO authenticated;
GRANT ALL ON public.family_memories TO service_role;

ALTER TABLE public.family_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own family memories"
  ON public.family_memories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own family memories"
  ON public.family_memories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own family memories"
  ON public.family_memories FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_family_memories_user ON public.family_memories(user_id, created_at DESC);
