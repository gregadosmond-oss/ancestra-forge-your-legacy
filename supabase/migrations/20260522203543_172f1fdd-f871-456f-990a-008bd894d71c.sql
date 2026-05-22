-- FIX 1: bind familysearch_search_inputs.email to the authenticated user's auth.users email
CREATE OR REPLACE FUNCTION public.enforce_familysearch_search_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    NEW.email := (SELECT email FROM auth.users WHERE id = NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_email_before_insert ON public.familysearch_search_inputs;
CREATE TRIGGER enforce_email_before_insert
BEFORE INSERT ON public.familysearch_search_inputs
FOR EACH ROW EXECUTE FUNCTION public.enforce_familysearch_search_email();

REVOKE EXECUTE ON FUNCTION public.enforce_familysearch_search_email() FROM PUBLIC, anon, authenticated;

-- FIX 2: expose surname_crests without the `prompt` column; revoke direct table reads
-- Note: surname_crests has columns (surname, image_url, prompt, created_at, model_version, payload-like fields)
-- — only safe columns are exposed below.
CREATE OR REPLACE VIEW public.surname_crests_public AS
SELECT surname, image_url, created_at
FROM public.surname_crests;

ALTER VIEW public.surname_crests_public OWNER TO postgres;
ALTER VIEW public.surname_crests_public SET (security_invoker = true);

GRANT SELECT ON public.surname_crests_public TO anon, authenticated;
REVOKE SELECT ON public.surname_crests FROM anon, authenticated;