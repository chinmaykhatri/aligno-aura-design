-- Create tasks table with time management features
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'medium',
  due_date TIMESTAMP WITH TIME ZONE,
  estimated_hours NUMERIC(5,2),
  tracked_hours NUMERIC(5,2) DEFAULT 0,
  assigned_to UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Users can view tasks for projects they have access to
CREATE POLICY "Users can view tasks for accessible projects"
ON public.tasks
FOR SELECT
USING (has_project_access(project_id, auth.uid()));

-- Project members can create tasks
CREATE POLICY "Project members can create tasks"
ON public.tasks
FOR INSERT
WITH CHECK (has_project_access(project_id, auth.uid()));

-- Project members can update tasks
CREATE POLICY "Project members can update tasks"
ON public.tasks
FOR UPDATE
USING (has_project_access(project_id, auth.uid()));

-- Project owners can delete tasks
CREATE POLICY "Project owners can delete tasks"
ON public.tasks
FOR DELETE
USING (is_project_owner(project_id, auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for tasks
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;

-- Add task activity types to the enum
ALTER TYPE public.activity_type ADD VALUE IF NOT EXISTS 'task_created';
ALTER TYPE public.activity_type ADD VALUE IF NOT EXISTS 'task_updated';
ALTER TYPE public.activity_type ADD VALUE IF NOT EXISTS 'task_completed';
ALTER TYPE public.activity_type ADD VALUE IF NOT EXISTS 'task_deleted';