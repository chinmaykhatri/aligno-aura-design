-- Create sprint templates table
CREATE TABLE public.sprint_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 14,
  goal_template TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sprint_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Project members can view sprint templates"
ON public.sprint_templates FOR SELECT
USING (has_project_access(project_id, auth.uid()));

CREATE POLICY "Project members can create sprint templates"
ON public.sprint_templates FOR INSERT
WITH CHECK (has_project_access(project_id, auth.uid()) AND auth.uid() = user_id);

CREATE POLICY "Project members can update sprint templates"
ON public.sprint_templates FOR UPDATE
USING (has_project_access(project_id, auth.uid()));

CREATE POLICY "Project owners can delete sprint templates"
ON public.sprint_templates FOR DELETE
USING (is_project_owner(project_id, auth.uid()));

-- Add updated_at trigger
CREATE TRIGGER update_sprint_templates_updated_at
BEFORE UPDATE ON public.sprint_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();