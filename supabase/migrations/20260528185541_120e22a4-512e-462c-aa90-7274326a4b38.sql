-- 1. Add tier column to existing profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'free';

UPDATE public.profiles SET tier = 'free' WHERE tier IS NULL;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_tier_check CHECK (tier IN ('free', 'legacy'));

-- 2. Create tool_completions table
CREATE TABLE public.tool_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_key text NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tool_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tool_completions TO authenticated;
GRANT ALL ON public.tool_completions TO service_role;

ALTER TABLE public.tool_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tool completions"
  ON public.tool_completions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tool completions"
  ON public.tool_completions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tool completions"
  ON public.tool_completions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);