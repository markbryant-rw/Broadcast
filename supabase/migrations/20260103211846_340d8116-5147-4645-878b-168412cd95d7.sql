-- Create table for user's favorite suburbs (max 5)
CREATE TABLE public.user_suburb_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  suburb text NOT NULL,
  city text,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, suburb)
);

-- Enable Row Level Security
ALTER TABLE public.user_suburb_favorites ENABLE ROW LEVEL SECURITY;

-- Users can view their own favorites
CREATE POLICY "Users can view own suburb favorites"
ON public.user_suburb_favorites
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own favorites
CREATE POLICY "Users can insert own suburb favorites"
ON public.user_suburb_favorites
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own favorites
CREATE POLICY "Users can update own suburb favorites"
ON public.user_suburb_favorites
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own favorites
CREATE POLICY "Users can delete own suburb favorites"
ON public.user_suburb_favorites
FOR DELETE
USING (auth.uid() = user_id);