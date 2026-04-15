
CREATE TABLE public.gifts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  surname text NOT NULL,
  sender_name text,
  recipient_name text,
  recipient_email text,
  personal_message text,
  status text NOT NULL DEFAULT 'pending',
  user_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;

-- Anyone with a gift link can view the gift
CREATE POLICY "Gifts are publicly readable by ID"
ON public.gifts
FOR SELECT
USING (true);

-- Authenticated users can create gifts
CREATE POLICY "Authenticated users can insert gifts"
ON public.gifts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own gifts
CREATE POLICY "Users can update own gifts"
ON public.gifts
FOR UPDATE
USING (auth.uid() = user_id);

CREATE TRIGGER update_gifts_updated_at
BEFORE UPDATE ON public.gifts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
