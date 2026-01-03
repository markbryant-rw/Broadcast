-- Add coordinate columns for geocoding to contacts
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS latitude numeric;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS longitude numeric;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS geocoded_at timestamp with time zone;

-- Add coordinate columns for geocoding to nearby_sales
ALTER TABLE public.nearby_sales ADD COLUMN IF NOT EXISTS latitude numeric;
ALTER TABLE public.nearby_sales ADD COLUMN IF NOT EXISTS longitude numeric;
ALTER TABLE public.nearby_sales ADD COLUMN IF NOT EXISTS geocoded_at timestamp with time zone;

-- Create index for efficient geo queries
CREATE INDEX IF NOT EXISTS idx_contacts_coordinates ON public.contacts (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_nearby_sales_coordinates ON public.nearby_sales (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;