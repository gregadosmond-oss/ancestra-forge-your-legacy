CREATE TABLE public.family_tree_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source text NOT NULL,
  name text NOT NULL,
  birth_date text,
  birth_place text,
  death_date text,
  death_place text,
  father_name text,
  mother_name text,
  profile_url text,
  summary text,
  confidence text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_tree_members TO authenticated;
GRANT ALL ON public.family_tree_members TO service_role;

ALTER TABLE public.family_tree_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own family tree members"
  ON public.family_tree_members FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own family tree members"
  ON public.family_tree_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own family tree members"
  ON public.family_tree_members FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own family tree members"
  ON public.family_tree_members FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_family_tree_members_user ON public.family_tree_members(user_id, position);