ALTER TABLE public.family_tree_members
  ADD COLUMN IF NOT EXISTS generations_back integer,
  ADD COLUMN IF NOT EXISTS relationship_label text,
  ADD COLUMN IF NOT EXISTS known_notes text;