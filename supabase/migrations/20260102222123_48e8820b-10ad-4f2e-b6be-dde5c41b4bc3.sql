-- Fix 1: Storage policy - Restrict chat-attachments to project members only
-- First, drop the existing overly permissive policy
DROP POLICY IF EXISTS "Project members can view attachments" ON storage.objects;

-- Create a proper policy that checks project membership via folder structure
-- Files are stored as: {project_id}/{filename}
CREATE POLICY "Project members can view attachments" 
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'chat-attachments' AND
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = (storage.foldername(name))[1]::uuid
    AND pm.user_id = auth.uid()
  )
);

-- Fix 2: Add DELETE policy to profiles table for GDPR compliance
CREATE POLICY "Users can delete their own profile"
ON public.profiles FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Fix 3: Restrict profile visibility - users should only see necessary info
-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view profiles of collaborators" ON public.profiles;

-- Create a more restrictive policy - users can view their own profile
-- and limited info of project collaborators
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Create a separate policy for viewing collaborator profiles (project context only)
CREATE POLICY "Users can view collaborator profiles in shared projects"
ON public.profiles FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM project_members pm1
    JOIN project_members pm2 ON pm1.project_id = pm2.project_id
    WHERE pm1.user_id = auth.uid() 
    AND pm2.user_id = profiles.user_id
  )
);