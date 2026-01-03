-- Add phone and address fields to contacts table
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS address_suburb text,
ADD COLUMN IF NOT EXISTS address_city text;

-- Create SMS templates table
CREATE TABLE public.sms_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid REFERENCES public.organizations(id),
  name text NOT NULL,
  body text NOT NULL,
  category text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on sms_templates
ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for sms_templates
CREATE POLICY "Users can view own sms templates"
ON public.sms_templates FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sms templates"
ON public.sms_templates FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sms templates"
ON public.sms_templates FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sms templates"
ON public.sms_templates FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_sms_templates_updated_at
BEFORE UPDATE ON public.sms_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Create SMS logs table for outbound tracking
CREATE TABLE public.sms_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  organization_id uuid REFERENCES public.organizations(id),
  phone_number text NOT NULL,
  message_body text NOT NULL,
  template_id uuid REFERENCES public.sms_templates(id) ON DELETE SET NULL,
  trigger_type text DEFAULT 'manual',
  trigger_property_address text,
  related_property_id text,
  sent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on sms_logs
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for sms_logs
CREATE POLICY "Users can view own sms logs"
ON public.sms_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sms logs"
ON public.sms_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create nearby sales table (REINZ mock)
CREATE TABLE public.nearby_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address text NOT NULL,
  suburb text NOT NULL,
  city text NOT NULL,
  sale_price numeric,
  sale_date date,
  property_type text,
  street_name text,
  street_number text,
  reinz_id text UNIQUE,
  synced_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on nearby_sales (public read for now since it's market data)
ALTER TABLE public.nearby_sales ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view nearby sales
CREATE POLICY "Authenticated users can view nearby sales"
ON public.nearby_sales FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Only platform admins can manage nearby sales (future: system sync)
CREATE POLICY "Platform admins can insert nearby sales"
ON public.nearby_sales FOR INSERT
WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can update nearby sales"
ON public.nearby_sales FOR UPDATE
USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can delete nearby sales"
ON public.nearby_sales FOR DELETE
USING (public.is_platform_admin(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_contacts_phone ON public.contacts(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_contacts_address_suburb ON public.contacts(address_suburb) WHERE address_suburb IS NOT NULL;
CREATE INDEX idx_sms_logs_contact_id ON public.sms_logs(contact_id);
CREATE INDEX idx_sms_logs_sent_at ON public.sms_logs(sent_at DESC);
CREATE INDEX idx_nearby_sales_suburb ON public.nearby_sales(suburb);
CREATE INDEX idx_nearby_sales_street_name ON public.nearby_sales(street_name);
CREATE INDEX idx_nearby_sales_sale_date ON public.nearby_sales(sale_date DESC);