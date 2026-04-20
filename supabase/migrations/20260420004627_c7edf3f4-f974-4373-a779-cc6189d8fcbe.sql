CREATE POLICY "Anyone can upload print designs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'print-designs');

CREATE POLICY "Anyone can update print designs"
ON storage.objects FOR UPDATE
USING (bucket_id = 'print-designs');