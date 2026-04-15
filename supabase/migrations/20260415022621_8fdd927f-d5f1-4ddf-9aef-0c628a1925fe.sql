DROP POLICY IF EXISTS "Public read access on crests bucket" ON storage.objects;

CREATE POLICY "Public read individual crests"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'crests' AND auth.role() = 'anon');