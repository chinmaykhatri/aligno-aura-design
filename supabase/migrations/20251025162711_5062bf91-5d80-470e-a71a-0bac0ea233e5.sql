-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_members table
CREATE TABLE public.project_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- Create helper function to check if user is project owner
CREATE OR REPLACE FUNCTION public.is_project_owner(project_id UUID, user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.project_members
    WHERE project_members.project_id = is_project_owner.project_id
      AND project_members.user_id = is_project_owner.user_id
      AND project_members.role = 'owner'
  )
$$;

-- Create helper function to check if user has access to project
CREATE OR REPLACE FUNCTION public.has_project_access(project_id UUID, user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.project_members
    WHERE project_members.project_id = has_project_access.project_id
      AND project_members.user_id = has_project_access.user_id
  )
$$;

-- RLS Policies for projects table
CREATE POLICY "Users can view projects they have access to"
ON public.projects
FOR SELECT
USING (
  auth.uid() = user_id OR public.has_project_access(id, auth.uid())
);

CREATE POLICY "Authenticated users can create projects"
ON public.projects
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Project owners can update projects"
ON public.projects
FOR UPDATE
USING (public.is_project_owner(id, auth.uid()));

CREATE POLICY "Project owners can delete projects"
ON public.projects
FOR DELETE
USING (public.is_project_owner(id, auth.uid()));

-- RLS Policies for project_members table
CREATE POLICY "Users can view members of projects they have access to"
ON public.project_members
FOR SELECT
USING (public.has_project_access(project_id, auth.uid()));

CREATE POLICY "Project owners can add members"
ON public.project_members
FOR INSERT
WITH CHECK (public.is_project_owner(project_id, auth.uid()));

CREATE POLICY "Project owners can remove members"
ON public.project_members
FOR DELETE
USING (public.is_project_owner(project_id, auth.uid()));

-- Add trigger for automatic timestamp updates on projects
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically add creator as owner when project is created
CREATE OR REPLACE FUNCTION public.handle_new_project()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES (NEW.id, NEW.user_id, 'owner');
  RETURN NEW;
END;
$$;

-- Add trigger to automatically add creator as owner
CREATE TRIGGER on_project_created
AFTER INSERT ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_project();

-- Enable realtime for projects table
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_members;