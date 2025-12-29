-- Create table for storing task and project risk assessments
CREATE TABLE public.risk_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  sprint_id UUID REFERENCES public.sprints(id) ON DELETE CASCADE,
  risk_score INTEGER NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  risk_factors JSONB NOT NULL DEFAULT '[]'::jsonb,
  mitigation_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  predicted_slip_days INTEGER DEFAULT 0,
  confidence_score INTEGER DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  assessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for roadmap items
CREATE TABLE public.roadmap_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  lane TEXT NOT NULL DEFAULT 'backlog' CHECK (lane IN ('backlog', 'q1', 'q2', 'q3', 'q4', 'now', 'next', 'later')),
  start_date DATE,
  end_date DATE,
  color TEXT DEFAULT '#6366f1',
  linked_tasks UUID[] DEFAULT '{}',
  linked_goals UUID[] DEFAULT '{}',
  linked_sprints UUID[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'at_risk')),
  priority INTEGER DEFAULT 0,
  ai_suggestions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for risk_assessments
CREATE POLICY "Project members can view risk assessments"
  ON public.risk_assessments FOR SELECT
  TO authenticated
  USING (has_project_access(project_id, auth.uid()));

CREATE POLICY "Project members can create risk assessments"
  ON public.risk_assessments FOR INSERT
  TO authenticated
  WITH CHECK (has_project_access(project_id, auth.uid()));

CREATE POLICY "Project members can update risk assessments"
  ON public.risk_assessments FOR UPDATE
  TO authenticated
  USING (has_project_access(project_id, auth.uid()));

CREATE POLICY "Project owners can delete risk assessments"
  ON public.risk_assessments FOR DELETE
  TO authenticated
  USING (is_project_owner(project_id, auth.uid()));

-- RLS policies for roadmap_items
CREATE POLICY "Project members can view roadmap items"
  ON public.roadmap_items FOR SELECT
  TO authenticated
  USING (has_project_access(project_id, auth.uid()));

CREATE POLICY "Project members can create roadmap items"
  ON public.roadmap_items FOR INSERT
  TO authenticated
  WITH CHECK (has_project_access(project_id, auth.uid()));

CREATE POLICY "Project members can update roadmap items"
  ON public.roadmap_items FOR UPDATE
  TO authenticated
  USING (has_project_access(project_id, auth.uid()));

CREATE POLICY "Project owners can delete roadmap items"
  ON public.roadmap_items FOR DELETE
  TO authenticated
  USING (is_project_owner(project_id, auth.uid()));

-- Add updated_at triggers
CREATE TRIGGER update_risk_assessments_updated_at
  BEFORE UPDATE ON public.risk_assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_roadmap_items_updated_at
  BEFORE UPDATE ON public.roadmap_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();