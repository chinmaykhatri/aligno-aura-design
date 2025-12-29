-- Create table for client portal access tokens
CREATE TABLE public.client_portal_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  name TEXT NOT NULL DEFAULT 'Client Portal Link',
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  views_count INTEGER NOT NULL DEFAULT 0,
  last_viewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_portal_tokens ENABLE ROW LEVEL SECURITY;

-- Only project owners can manage tokens
CREATE POLICY "Project owners can view tokens"
ON public.client_portal_tokens
FOR SELECT
TO authenticated
USING (is_project_owner(project_id, auth.uid()));

CREATE POLICY "Project owners can create tokens"
ON public.client_portal_tokens
FOR INSERT
TO authenticated
WITH CHECK (is_project_owner(project_id, auth.uid()) AND auth.uid() = user_id);

CREATE POLICY "Project owners can update tokens"
ON public.client_portal_tokens
FOR UPDATE
TO authenticated
USING (is_project_owner(project_id, auth.uid()));

CREATE POLICY "Project owners can delete tokens"
ON public.client_portal_tokens
FOR DELETE
TO authenticated
USING (is_project_owner(project_id, auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_client_portal_tokens_updated_at
BEFORE UPDATE ON public.client_portal_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for token lookups
CREATE INDEX idx_client_portal_tokens_token ON public.client_portal_tokens(token);
CREATE INDEX idx_client_portal_tokens_project ON public.client_portal_tokens(project_id);