-- Create sprint_retrospectives table for team learnings
CREATE TABLE public.sprint_retrospectives (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sprint_id uuid NOT NULL REFERENCES public.sprints(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  category text NOT NULL CHECK (category IN ('went_well', 'to_improve', 'action_item')),
  content text NOT NULL,
  is_resolved boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sprint_retrospectives ENABLE ROW LEVEL SECURITY;

-- RLS policies - based on sprint project access
CREATE POLICY "Project members can view retrospectives" 
ON public.sprint_retrospectives FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.sprints s 
    WHERE s.id = sprint_retrospectives.sprint_id 
    AND has_project_access(s.project_id, auth.uid())
  )
);

CREATE POLICY "Project members can create retrospectives" 
ON public.sprint_retrospectives FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.sprints s 
    WHERE s.id = sprint_retrospectives.sprint_id 
    AND has_project_access(s.project_id, auth.uid())
  )
);

CREATE POLICY "Users can update their own retrospectives" 
ON public.sprint_retrospectives FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own retrospectives" 
ON public.sprint_retrospectives FOR DELETE 
USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.sprint_retrospectives;