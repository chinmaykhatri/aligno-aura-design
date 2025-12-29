-- Create table for project integrations
CREATE TABLE public.project_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL, -- 'slack', 'github', 'google_calendar'
  config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, integration_type)
);

-- Enable RLS
ALTER TABLE public.project_integrations ENABLE ROW LEVEL SECURITY;

-- Only project owners can manage integrations
CREATE POLICY "Project owners can view integrations"
ON public.project_integrations
FOR SELECT
TO authenticated
USING (is_project_owner(project_id, auth.uid()));

CREATE POLICY "Project owners can create integrations"
ON public.project_integrations
FOR INSERT
TO authenticated
WITH CHECK (is_project_owner(project_id, auth.uid()));

CREATE POLICY "Project owners can update integrations"
ON public.project_integrations
FOR UPDATE
TO authenticated
USING (is_project_owner(project_id, auth.uid()));

CREATE POLICY "Project owners can delete integrations"
ON public.project_integrations
FOR DELETE
TO authenticated
USING (is_project_owner(project_id, auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_project_integrations_updated_at
BEFORE UPDATE ON public.project_integrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_project_integrations_project ON public.project_integrations(project_id);
CREATE INDEX idx_project_integrations_type ON public.project_integrations(integration_type);