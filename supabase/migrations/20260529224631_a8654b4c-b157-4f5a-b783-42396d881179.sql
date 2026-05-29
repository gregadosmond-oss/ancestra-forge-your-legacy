-- Add DELETE RLS policy on family_memories
CREATE POLICY "Users can delete their own family memories"
ON public.family_memories
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);