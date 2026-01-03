-- Create table for tracking sale completions at the sale level
CREATE TABLE public.user_sale_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  sale_id UUID NOT NULL REFERENCES public.nearby_sales(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, sale_id)
);

-- Enable RLS
ALTER TABLE public.user_sale_completions ENABLE ROW LEVEL SECURITY;

-- Users can view their own completions
CREATE POLICY "Users can view own completions" 
ON public.user_sale_completions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own completions
CREATE POLICY "Users can insert own completions" 
ON public.user_sale_completions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own completions (for undo)
CREATE POLICY "Users can delete own completions" 
ON public.user_sale_completions 
FOR DELETE 
USING (auth.uid() = user_id);