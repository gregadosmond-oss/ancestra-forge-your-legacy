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

CREATE INDEX surname_crests_created_at_idx
  ON public.surname_crests (created_at DESC);

INSERT INTO storage.buckets (id, name, public)
VALUES ('crests', 'crests', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read access on crests bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'crests');