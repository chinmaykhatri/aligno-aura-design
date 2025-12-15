-- Create task dependencies table for many-to-many relationships
CREATE TABLE public.task_dependencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(task_id, depends_on_task_id),
  CHECK (task_id != depends_on_task_id)
);

-- Enable RLS
ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;

-- RLS policies - users can manage dependencies for tasks in projects they have access to
CREATE POLICY "Users can view dependencies for accessible tasks"
ON public.task_dependencies FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_dependencies.task_id
    AND has_project_access(t.project_id, auth.uid())
  )
);

CREATE POLICY "Users can create dependencies for accessible tasks"
ON public.task_dependencies FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_dependencies.task_id
    AND has_project_access(t.project_id, auth.uid())
  )
);

CREATE POLICY "Users can delete dependencies for accessible tasks"
ON public.task_dependencies FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_dependencies.task_id
    AND has_project_access(t.project_id, auth.uid())
  )
);