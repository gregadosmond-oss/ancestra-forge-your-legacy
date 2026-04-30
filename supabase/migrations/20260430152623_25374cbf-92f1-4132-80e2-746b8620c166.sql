-- 1. familysearch_sessions
CREATE TABLE public.familysearch_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token text NOT NULL,
  refresh_token text,
  token_expires_at timestamptz NOT NULL,
  familysearch_person_id text,
  last_used_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_familysearch_sessions_user_id ON public.familysearch_sessions(user_id);

ALTER TABLE public.familysearch_sessions ENABLE ROW LEVEL SECURITY;

-- Owner can read their own session
CREATE POLICY "Users can view their own FS session"
ON public.familysearch_sessions
FOR SELECT
USING (auth.uid() = user_id);

-- Service role manages writes
CREATE POLICY "Service role can insert FS sessions"
ON public.familysearch_sessions
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update FS sessions"
ON public.familysearch_sessions
FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can delete FS sessions"
ON public.familysearch_sessions
FOR DELETE
USING (auth.role() = 'service_role');

-- Auto-update updated_at (reuse existing public.update_updated_at_column())
CREATE TRIGGER update_familysearch_sessions_updated_at
BEFORE UPDATE ON public.familysearch_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 2. familysearch_search_inputs
-- TODO before production: rate-limit anonymous inserts (e.g., per IP / session_id).
CREATE TABLE public.familysearch_search_inputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  surname text NOT NULL,
  first_name text,
  birth_year_approx int,
  birth_place text,
  father_first_name text,
  mother_first_name text,
  mother_maiden_name text,
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_fs_search_inputs_email_lower ON public.familysearch_search_inputs(lower(email));
CREATE INDEX idx_fs_search_inputs_surname ON public.familysearch_search_inputs(surname);

ALTER TABLE public.familysearch_search_inputs ENABLE ROW LEVEL SECURITY;

-- SELECT: owner OR anonymous rows (secured later by session_id match in app queries)
CREATE POLICY "Users can view own or anonymous search inputs"
ON public.familysearch_search_inputs
FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

-- INSERT: anyone (anonymous + authenticated). TODO: rate limit before production.
CREATE POLICY "Anyone can insert search inputs"
ON public.familysearch_search_inputs
FOR INSERT
WITH CHECK (true);

-- UPDATE/DELETE: service role only
CREATE POLICY "Service role can update search inputs"
ON public.familysearch_search_inputs
FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can delete search inputs"
ON public.familysearch_search_inputs
FOR DELETE
USING (auth.role() = 'service_role');