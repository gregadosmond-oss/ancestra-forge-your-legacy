INSERT INTO storage.buckets (id, name, public)
VALUES ('print-designs', 'print-designs', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Print designs are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'print-designs');

CREATE POLICY "Service role can manage print designs"
ON storage.objects FOR ALL
USING (bucket_id = 'print-designs' AND auth.role() = 'service_role');