
-- =====================================================================
-- ERROR 1 + 2: lock down legacy-books bucket
-- =====================================================================
UPDATE storage.buckets SET public = false WHERE id = 'legacy-books';

DROP POLICY IF EXISTS "Public read on legacy-books" ON storage.objects;
DROP POLICY IF EXISTS "Service role write on legacy-books" ON storage.objects;

CREATE POLICY "Owners can read their own book PDFs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'legacy-books'
  AND EXISTS (
    SELECT 1 FROM public.legacy_book_orders
    WHERE legacy_book_orders.user_id = auth.uid()
      AND (
        storage.objects.name = SPLIT_PART(legacy_book_orders.interior_pdf_url, 'legacy-books/', 2)
        OR storage.objects.name = SPLIT_PART(legacy_book_orders.cover_pdf_url, 'legacy-books/', 2)
      )
  )
);

CREATE POLICY "Service role write on legacy-books"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (
  bucket_id = 'legacy-books'
  AND auth.role() = 'service_role'
);

CREATE POLICY "Service role update on legacy-books"
ON storage.objects
FOR UPDATE
TO service_role
USING (bucket_id = 'legacy-books' AND auth.role() = 'service_role')
WITH CHECK (bucket_id = 'legacy-books' AND auth.role() = 'service_role');

CREATE POLICY "Service role delete on legacy-books"
ON storage.objects
FOR DELETE
TO service_role
USING (bucket_id = 'legacy-books' AND auth.role() = 'service_role');

-- =====================================================================
-- WARNING 3 + 8: crests bucket — allow authenticated reads, tighten path
-- =====================================================================
DROP POLICY IF EXISTS "Public read individual crests" ON storage.objects;

CREATE POLICY "Public read individual crests"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'crests'
  AND name ~* '\.(png|jpg|jpeg|webp|svg)$'
);

-- =====================================================================
-- WARNING 4: book_orders explicit write rules
-- =====================================================================
CREATE POLICY "Service role can insert book_orders"
ON public.book_orders
FOR INSERT
TO service_role
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update book_orders"
ON public.book_orders
FOR UPDATE
TO service_role
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can delete book_orders"
ON public.book_orders
FOR DELETE
TO service_role
USING (auth.role() = 'service_role');

-- =====================================================================
-- WARNING 5: generation_logs explicit insert rule for service role
-- =====================================================================
CREATE POLICY "Service role can insert generation_logs"
ON public.generation_logs
FOR INSERT
TO service_role
WITH CHECK (auth.role() = 'service_role');

-- =====================================================================
-- WARNING 6 + 7: revoke EXECUTE on SECURITY DEFINER helpers from public
-- =====================================================================
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;

-- =====================================================================
-- WARNING 9: replace USING (true) / WITH CHECK (true) with proper checks
-- =====================================================================

-- legacy_book_orders: tighten service-role policies
DROP POLICY IF EXISTS "Service role can insert book orders" ON public.legacy_book_orders;
DROP POLICY IF EXISTS "Service role can update book orders" ON public.legacy_book_orders;
DROP POLICY IF EXISTS "Service role can delete book orders" ON public.legacy_book_orders;

CREATE POLICY "Service role can insert book orders"
ON public.legacy_book_orders
FOR INSERT
TO service_role
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update book orders"
ON public.legacy_book_orders
FOR UPDATE
TO service_role
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can delete book orders"
ON public.legacy_book_orders
FOR DELETE
TO service_role
USING (auth.role() = 'service_role');

-- book_waitlist: require non-empty email instead of WITH CHECK (true)
DROP POLICY IF EXISTS "Anyone can insert into book_waitlist" ON public.book_waitlist;
CREATE POLICY "Anyone can insert into book_waitlist"
ON public.book_waitlist
FOR INSERT
TO anon, authenticated
WITH CHECK (email IS NOT NULL AND length(trim(email)) > 3 AND email LIKE '%@%');

-- journey_subscribers: same tightening
DROP POLICY IF EXISTS "Anyone can subscribe to journey" ON public.journey_subscribers;
CREATE POLICY "Anyone can subscribe to journey"
ON public.journey_subscribers
FOR INSERT
TO anon, authenticated
WITH CHECK (email IS NOT NULL AND length(trim(email)) > 3 AND email LIKE '%@%');
