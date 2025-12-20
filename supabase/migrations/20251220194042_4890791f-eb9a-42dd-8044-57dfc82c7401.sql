-- Create time-off tracking table
CREATE TABLE public.team_time_off (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  hours_per_day NUMERIC NOT NULL DEFAULT 8,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_time_off ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Project members can view time-off"
ON public.team_time_off FOR SELECT
USING (has_project_access(project_id, auth.uid()));

CREATE POLICY "Users can add their own time-off"
ON public.team_time_off FOR INSERT
WITH CHECK (has_project_access(project_id, auth.uid()) AND auth.uid() = user_id);

CREATE POLICY "Users can update their own time-off"
ON public.team_time_off FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own time-off"
ON public.team_time_off FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_team_time_off_updated_at
BEFORE UPDATE ON public.team_time_off
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();