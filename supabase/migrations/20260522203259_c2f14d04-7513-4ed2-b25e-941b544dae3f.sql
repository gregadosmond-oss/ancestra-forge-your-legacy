-- FIX 1: familysearch_sessions — restrict SELECT to service_role only.
-- OAuth access/refresh tokens must never be reachable from the client.
-- Edge functions use service_role and are unaffected.
DROP POLICY IF EXISTS "Users can view their own FS session" ON public.familysearch_sessions;

CREATE POLICY "Service role can read FS sessions"
ON public.familysearch_sessions
FOR SELECT
TO service_role
USING (auth.role() = 'service_role');

-- FIX 2: print-designs — add explicit service_role SELECT policy.
-- Purely additive (service_role bypasses RLS); silences scanner warning.
CREATE POLICY "Service role read on print-designs"
ON storage.objects
FOR SELECT
TO service_role
USING (bucket_id = 'print-designs');

-- INTENTIONAL (do not "fix"):
-- email_unsubscribe_tokens: intentionally service-role only; scanner false positive.
-- crests bucket: intentionally world-readable by URL for OG previews, public /f/:surname
-- pages, and marketing emails. Do NOT restrict.