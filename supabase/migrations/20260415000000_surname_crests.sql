-- surname_crests: one cached crest image URL per surname.
-- Same service-role-only write pattern as surname_facts.

CREATE TABLE public.surname_crests (
  surname    TEXT PRIMARY KEY,
  image_url  TEXT NOT NULL,
  prompt     TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.surname_crests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cached crests"
  ON public.surname_crests FOR SELECT
  USING (true);

-- Supabase Storage: public crests bucket.
-- Files stored as {normalized_surname}.png
INSERT INTO storage.buckets (id, name, public)
VALUES ('crests', 'crests', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read access on crests bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'crests');
