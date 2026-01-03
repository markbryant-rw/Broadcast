-- Create sale_contact_actions table to track user actions on contacts per sale
CREATE TABLE public.sale_contact_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sale_id UUID NOT NULL REFERENCES public.nearby_sales(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('contacted', 'ignored')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one action per user/sale/contact combination
  UNIQUE(user_id, sale_id, contact_id)
);

-- Enable RLS
ALTER TABLE public.sale_contact_actions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own sale contact actions"
ON public.sale_contact_actions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sale contact actions"
ON public.sale_contact_actions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sale contact actions"
ON public.sale_contact_actions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sale contact actions"
ON public.sale_contact_actions
FOR DELETE
USING (auth.uid() = user_id);

-- Index for efficient queries
CREATE INDEX idx_sale_contact_actions_sale_id ON public.sale_contact_actions(sale_id);
CREATE INDEX idx_sale_contact_actions_user_id ON public.sale_contact_actions(user_id);