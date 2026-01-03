-- Add last_sms_at to contacts for tracking when contacts were last messaged
ALTER TABLE public.contacts
ADD COLUMN last_sms_at timestamp with time zone DEFAULT NULL;

-- Add related_sale_id to sms_logs to link SMS to the triggering sale
ALTER TABLE public.sms_logs
ADD COLUMN related_sale_id uuid REFERENCES public.nearby_sales(id) ON DELETE SET NULL;

-- Create index for faster lookups on last_sms_at
CREATE INDEX idx_contacts_last_sms_at ON public.contacts(last_sms_at);

-- Create index for related_sale_id lookups
CREATE INDEX idx_sms_logs_related_sale_id ON public.sms_logs(related_sale_id);

-- Create function to auto-update last_sms_at when SMS is logged
CREATE OR REPLACE FUNCTION public.update_contact_last_sms_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.contact_id IS NOT NULL THEN
    UPDATE public.contacts
    SET last_sms_at = NEW.sent_at
    WHERE id = NEW.contact_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-update last_sms_at
CREATE TRIGGER trigger_update_contact_last_sms_at
AFTER INSERT ON public.sms_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_contact_last_sms_at();