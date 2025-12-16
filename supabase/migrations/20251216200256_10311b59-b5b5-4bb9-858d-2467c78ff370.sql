-- Create sprints table for time-boxed iterations
CREATE TABLE public.sprints (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  goal text,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  status text NOT NULL DEFAULT 'planning',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add sprint_id to tasks table
ALTER TABLE public.tasks ADD COLUMN sprint_id uuid REFERENCES public.sprints(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;

-- RLS policies for sprints
CREATE POLICY "Project members can view sprints" 
ON public.sprints FOR SELECT 
USING (has_project_access(project_id, auth.uid()));

CREATE POLICY "Project members can create sprints" 
ON public.sprints FOR INSERT 
WITH CHECK (has_project_access(project_id, auth.uid()));

CREATE POLICY "Project members can update sprints" 
ON public.sprints FOR UPDATE 
USING (has_project_access(project_id, auth.uid()));

CREATE POLICY "Project owners can delete sprints" 
ON public.sprints FOR DELETE 
USING (is_project_owner(project_id, auth.uid()));

-- Enable realtime for sprints
ALTER PUBLICATION supabase_realtime ADD TABLE public.sprints;