-- Lock down print-designs bucket: remove public read, make bucket private.
-- Service role retains full access via existing policies.
UPDATE storage.buckets SET public = false WHERE id = 'print-designs';

DROP POLICY IF EXISTS "Print designs are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage print designs" ON storage.objects;