CREATE TABLE public.surname_facts (
  surname TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  model_version TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.surname_facts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cached facts"
  ON public.surname_facts FOR SELECT
  USING (true);

CREATE TABLE public.generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  surname TEXT NOT NULL,
  call_type TEXT NOT NULL CHECK (call_type IN ('facts', 'story')),
  cache_hit BOOLEAN NOT NULL,
  duration_ms INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  error_reason TEXT,
  model_version TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.generation_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX generation_logs_created_at_idx
  ON public.generation_logs (created_at DESC);
CREATE INDEX generation_logs_surname_idx
  ON public.generation_logs (surname);