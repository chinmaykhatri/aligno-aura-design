-- Create OKRs (Objectives and Key Results) table
CREATE TABLE public.okrs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'objective' CHECK (type IN ('objective', 'key_result')),
  parent_id UUID REFERENCES public.okrs(id) ON DELETE CASCADE,
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  unit TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  progress NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.okrs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for OKRs
CREATE POLICY "Users can view OKRs for their projects" 
  ON public.okrs FOR SELECT 
  TO authenticated
  USING (
    project_id IS NULL AND user_id = auth.uid()
    OR project_id IS NOT NULL AND has_project_access(project_id, auth.uid())
  );

CREATE POLICY "Users can create OKRs" 
  ON public.okrs FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update OKRs they created" 
  ON public.okrs FOR UPDATE 
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete OKRs they created" 
  ON public.okrs FOR DELETE 
  TO authenticated
  USING (user_id = auth.uid());

-- Add updated_at trigger
CREATE TRIGGER update_okrs_updated_at
  BEFORE UPDATE ON public.okrs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create OKR-task linkage table
CREATE TABLE public.okr_task_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  okr_id UUID NOT NULL REFERENCES public.okrs(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(okr_id, task_id)
);

-- Enable RLS on link table
ALTER TABLE public.okr_task_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view OKR task links" 
  ON public.okr_task_links FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.okrs o 
      WHERE o.id = okr_id 
      AND (
        (o.project_id IS NULL AND o.user_id = auth.uid())
        OR (o.project_id IS NOT NULL AND has_project_access(o.project_id, auth.uid()))
      )
    )
  );

CREATE POLICY "Users can create OKR task links" 
  ON public.okr_task_links FOR INSERT 
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.okrs o 
      WHERE o.id = okr_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete OKR task links" 
  ON public.okr_task_links FOR DELETE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.okrs o 
      WHERE o.id = okr_id AND o.user_id = auth.uid()
    )
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.okrs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.okr_task_links;