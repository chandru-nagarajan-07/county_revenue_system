
-- Workflow configurations
CREATE TABLE public.workflow_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id TEXT NOT NULL UNIQUE,
  service_title TEXT NOT NULL,
  charge_override TEXT,
  stages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.workflow_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read workflow_configs" ON public.workflow_configs FOR SELECT USING (true);
CREATE POLICY "Anyone can insert workflow_configs" ON public.workflow_configs FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update workflow_configs" ON public.workflow_configs FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete workflow_configs" ON public.workflow_configs FOR DELETE USING (true);

-- API endpoint configurations
CREATE TABLE public.api_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id TEXT NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL DEFAULT '',
  method TEXT NOT NULL DEFAULT 'POST',
  headers JSONB NOT NULL DEFAULT '[]'::jsonb,
  request_mappings JSONB NOT NULL DEFAULT '[]'::jsonb,
  response_mappings JSONB NOT NULL DEFAULT '[]'::jsonb,
  code_template TEXT NOT NULL DEFAULT '',
  tested BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.api_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read api_configs" ON public.api_configs FOR SELECT USING (true);
CREATE POLICY "Anyone can insert api_configs" ON public.api_configs FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update api_configs" ON public.api_configs FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete api_configs" ON public.api_configs FOR DELETE USING (true);

-- Change requests (maker-checker)
CREATE TYPE public.change_status AS ENUM ('draft','submitted','in_review','testing','approved','rejected','published');
CREATE TYPE public.change_type AS ENUM ('workflow','api');

CREATE TABLE public.change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  change_type change_type NOT NULL,
  service_id TEXT NOT NULL,
  config_snapshot JSONB NOT NULL,
  status change_status NOT NULL DEFAULT 'draft',
  submitted_by TEXT NOT NULL DEFAULT 'Maker',
  reviewed_by TEXT,
  review_notes TEXT,
  test_results JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.change_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read change_requests" ON public.change_requests FOR SELECT USING (true);
CREATE POLICY "Anyone can insert change_requests" ON public.change_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update change_requests" ON public.change_requests FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete change_requests" ON public.change_requests FOR DELETE USING (true);

-- Published versions
CREATE TABLE public.published_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_request_id UUID REFERENCES public.change_requests(id),
  version_number INT NOT NULL,
  change_type change_type NOT NULL,
  service_id TEXT NOT NULL,
  config_snapshot JSONB NOT NULL,
  published_by TEXT NOT NULL DEFAULT 'Checker',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.published_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read published_versions" ON public.published_versions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert published_versions" ON public.published_versions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update published_versions" ON public.published_versions FOR UPDATE USING (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_workflow_configs_updated_at BEFORE UPDATE ON public.workflow_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_api_configs_updated_at BEFORE UPDATE ON public.api_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_change_requests_updated_at BEFORE UPDATE ON public.change_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
