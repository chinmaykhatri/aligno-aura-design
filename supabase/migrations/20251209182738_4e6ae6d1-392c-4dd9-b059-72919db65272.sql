-- Create project messages table for team chat
CREATE TABLE public.project_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Project members can view messages"
ON public.project_messages
FOR SELECT
USING (has_project_access(project_id, auth.uid()));

CREATE POLICY "Project members can send messages"
ON public.project_messages
FOR INSERT
WITH CHECK (auth.uid() = user_id AND has_project_access(project_id, auth.uid()));

CREATE POLICY "Users can delete their own messages"
ON public.project_messages
FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_messages;

-- Create index for faster queries
CREATE INDEX idx_project_messages_project_id ON public.project_messages(project_id);
CREATE INDEX idx_project_messages_created_at ON public.project_messages(created_at DESC);