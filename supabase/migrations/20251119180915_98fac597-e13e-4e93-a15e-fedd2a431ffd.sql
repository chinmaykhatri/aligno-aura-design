-- Create activity types enum
CREATE TYPE public.activity_type AS ENUM (
  'project_created',
  'project_updated',
  'project_deleted',
  'project_status_changed',
  'project_progress_updated',
  'member_added',
  'member_removed',
  'member_role_changed'
);

-- Create activities table
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  activity_type public.activity_type NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_activities_user_id ON public.activities(user_id);
CREATE INDEX idx_activities_project_id ON public.activities(project_id);
CREATE INDEX idx_activities_created_at ON public.activities(created_at DESC);
CREATE INDEX idx_activities_type ON public.activities(activity_type);

-- Enable RLS
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Users can view activities for projects they have access to
CREATE POLICY "Users can view activities for accessible projects"
ON public.activities
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_members.project_id = activities.project_id
      AND project_members.user_id = auth.uid()
  )
);

-- System can insert activities (via triggers or service role)
CREATE POLICY "Service role can insert activities"
ON public.activities
FOR INSERT
WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;