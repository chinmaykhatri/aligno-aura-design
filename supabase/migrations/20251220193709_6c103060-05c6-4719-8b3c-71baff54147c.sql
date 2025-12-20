-- Create team member capacity table for sprints
CREATE TABLE public.sprint_member_capacity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sprint_id UUID NOT NULL REFERENCES public.sprints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  available_hours NUMERIC NOT NULL DEFAULT 40,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(sprint_id, user_id)
);

-- Enable RLS
ALTER TABLE public.sprint_member_capacity ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Project members can view sprint capacity"
ON public.sprint_member_capacity FOR SELECT
USING (EXISTS (
  SELECT 1 FROM sprints s 
  WHERE s.id = sprint_member_capacity.sprint_id 
  AND has_project_access(s.project_id, auth.uid())
));

CREATE POLICY "Project members can manage sprint capacity"
ON public.sprint_member_capacity FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM sprints s 
  WHERE s.id = sprint_member_capacity.sprint_id 
  AND has_project_access(s.project_id, auth.uid())
) AND auth.uid() = user_id);

CREATE POLICY "Project members can update sprint capacity"
ON public.sprint_member_capacity FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM sprints s 
  WHERE s.id = sprint_member_capacity.sprint_id 
  AND has_project_access(s.project_id, auth.uid())
));

CREATE POLICY "Project members can delete sprint capacity"
ON public.sprint_member_capacity FOR DELETE
USING (EXISTS (
  SELECT 1 FROM sprints s 
  WHERE s.id = sprint_member_capacity.sprint_id 
  AND has_project_access(s.project_id, auth.uid())
));

-- Add trigger for updated_at
CREATE TRIGGER update_sprint_member_capacity_updated_at
BEFORE UPDATE ON public.sprint_member_capacity
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();