-- Create scheduling history table
CREATE TABLE public.scheduling_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  task_title TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('schedule', 'reassignment')),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scheduling_history ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Project members can view scheduling history"
ON public.scheduling_history
FOR SELECT
USING (has_project_access(project_id, auth.uid()));

CREATE POLICY "Project members can insert scheduling history"
ON public.scheduling_history
FOR INSERT
WITH CHECK (auth.uid() = user_id AND has_project_access(project_id, auth.uid()));

-- Index for faster queries
CREATE INDEX idx_scheduling_history_project_id ON public.scheduling_history(project_id);
CREATE INDEX idx_scheduling_history_created_at ON public.scheduling_history(created_at DESC);