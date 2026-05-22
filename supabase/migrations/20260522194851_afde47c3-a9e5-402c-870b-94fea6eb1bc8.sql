
-- =====================================================
-- 1. familysearch_search_inputs: lock down
-- =====================================================
DROP POLICY IF EXISTS "Users can view own or anonymous search inputs" ON public.familysearch_search_inputs;
DROP POLICY IF EXISTS "Anyone can insert search inputs" ON public.familysearch_search_inputs;
DROP POLICY IF EXISTS "Service role can update search inputs" ON public.familysearch_search_inputs;
DROP POLICY IF EXISTS "Service role can delete search inputs" ON public.familysearch_search_inputs;

ALTER TABLE public.familysearch_search_inputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own search inputs"
  ON public.familysearch_search_inputs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own search inputs"
  ON public.familysearch_search_inputs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own search inputs"
  ON public.familysearch_search_inputs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own search inputs"
  ON public.familysearch_search_inputs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- 2. gifts: lock down (recipients use edge function)
-- =====================================================
DROP POLICY IF EXISTS "Gifts are publicly readable by ID" ON public.gifts;
DROP POLICY IF EXISTS "Public can read gifts by id" ON public.gifts;
DROP POLICY IF EXISTS "Authenticated users can insert gifts" ON public.gifts;
DROP POLICY IF EXISTS "Users can update own gifts" ON public.gifts;

ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers view own gifts"
  ON public.gifts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Buyers insert own gifts"
  ON public.gifts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Buyers update own gifts"
  ON public.gifts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Buyers delete own gifts"
  ON public.gifts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- 4. print-designs storage: only service_role writes
-- =====================================================
DROP POLICY IF EXISTS "Anyone can upload print designs" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update print designs" ON storage.objects;

CREATE POLICY "Service role insert print designs"
  ON storage.objects FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'print-designs');

CREATE POLICY "Service role update print designs"
  ON storage.objects FOR UPDATE
  TO service_role
  USING (bucket_id = 'print-designs')
  WITH CHECK (bucket_id = 'print-designs');

CREATE POLICY "Service role delete print designs"
  ON storage.objects FOR DELETE
  TO service_role
  USING (bucket_id = 'print-designs');

-- =====================================================
-- 5. generation_logs: explicit service-role-only read
-- =====================================================
ALTER TABLE public.generation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role reads generation_logs"
  ON public.generation_logs FOR SELECT
  TO service_role
  USING (true);

-- =====================================================
-- 6. journey_subscribers: explicit service-role-only read
-- =====================================================
ALTER TABLE public.journey_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role reads journey_subscribers"
  ON public.journey_subscribers FOR SELECT
  TO service_role
  USING (true);

-- =====================================================
-- 7-9. SECURITY DEFINER functions: lock down + search_path
-- =====================================================

-- update_updated_at_column (trigger function, harmless but harden)
ALTER FUNCTION public.update_updated_at_column() SET search_path = '';

-- handle_new_user (trigger function)
ALTER FUNCTION public.handle_new_user() SET search_path = '';

-- Email queue helpers: revoke from anon/authenticated, set search_path
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = '';
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = '';
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = '';
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = '';

REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
