
-- Create goals table
CREATE TABLE public.goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'in_progress',
  progress INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create milestones table
CREATE TABLE public.milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  target_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

-- Goals RLS policies
CREATE POLICY "Users can view goals for accessible projects"
ON public.goals FOR SELECT
USING (has_project_access(project_id, auth.uid()));

CREATE POLICY "Project members can create goals"
ON public.goals FOR INSERT
WITH CHECK (has_project_access(project_id, auth.uid()));

CREATE POLICY "Project members can update goals"
ON public.goals FOR UPDATE
USING (has_project_access(project_id, auth.uid()));

CREATE POLICY "Project owners can delete goals"
ON public.goals FOR DELETE
USING (is_project_owner(project_id, auth.uid()));

-- Milestones RLS policies
CREATE POLICY "Users can view milestones for accessible goals"
ON public.milestones FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.goals g
  WHERE g.id = milestones.goal_id
  AND has_project_access(g.project_id, auth.uid())
));

CREATE POLICY "Project members can create milestones"
ON public.milestones FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.goals g
  WHERE g.id = milestones.goal_id
  AND has_project_access(g.project_id, auth.uid())
));

CREATE POLICY "Project members can update milestones"
ON public.milestones FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.goals g
  WHERE g.id = milestones.goal_id
  AND has_project_access(g.project_id, auth.uid())
));

CREATE POLICY "Project owners can delete milestones"
ON public.milestones FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.goals g
  WHERE g.id = milestones.goal_id
  AND is_project_owner(g.project_id, auth.uid())
));

-- Updated at trigger for goals
CREATE TRIGGER update_goals_updated_at
BEFORE UPDATE ON public.goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add goal activity types
ALTER TYPE public.activity_type ADD VALUE 'goal_created';
ALTER TYPE public.activity_type ADD VALUE 'goal_updated';
ALTER TYPE public.activity_type ADD VALUE 'goal_completed';
ALTER TYPE public.activity_type ADD VALUE 'milestone_completed';

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.goals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.milestones;
