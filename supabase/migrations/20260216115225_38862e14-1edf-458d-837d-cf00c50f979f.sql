
-- Customer segments table (admin-managed)
CREATE TABLE public.customer_segments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  segment_key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read customer_segments" ON public.customer_segments FOR SELECT USING (true);
CREATE POLICY "Anyone can insert customer_segments" ON public.customer_segments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update customer_segments" ON public.customer_segments FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete customer_segments" ON public.customer_segments FOR DELETE USING (true);

-- Seed default segments
INSERT INTO public.customer_segments (segment_key, label, sort_order) VALUES
  ('high-value', 'Premium', 1),
  ('sme', 'SME / Business', 2),
  ('retail', 'Retail', 3),
  ('young-professional', 'Young Professional', 4);

-- Pricing configs table (one row per service × segment)
CREATE TABLE public.pricing_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id TEXT NOT NULL,
  segment_key TEXT NOT NULL REFERENCES public.customer_segments(segment_key) ON DELETE CASCADE,
  service_fee NUMERIC NOT NULL DEFAULT 0,
  percentage_fee NUMERIC NOT NULL DEFAULT 0,
  min_charge NUMERIC NOT NULL DEFAULT 0,
  max_charge NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(service_id, segment_key)
);

ALTER TABLE public.pricing_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read pricing_configs" ON public.pricing_configs FOR SELECT USING (true);
CREATE POLICY "Anyone can insert pricing_configs" ON public.pricing_configs FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update pricing_configs" ON public.pricing_configs FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete pricing_configs" ON public.pricing_configs FOR DELETE USING (true);

CREATE TRIGGER update_pricing_configs_updated_at
  BEFORE UPDATE ON public.pricing_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
