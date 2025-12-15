-- Fix RLS policies to only apply to authenticated users (not anonymous)
-- This prevents anonymous users from even attempting to access these tables

-- Tasks table
DROP POLICY IF EXISTS "Project members can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Project members can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Project owners can delete tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can view tasks for accessible projects" ON public.tasks;

CREATE POLICY "Project members can create tasks" 
ON public.tasks FOR INSERT TO authenticated
WITH CHECK (has_project_access(project_id, auth.uid()));

CREATE POLICY "Project members can update tasks" 
ON public.tasks FOR UPDATE TO authenticated
USING (has_project_access(project_id, auth.uid()));

CREATE POLICY "Project owners can delete tasks" 
ON public.tasks FOR DELETE TO authenticated
USING (is_project_owner(project_id, auth.uid()));

CREATE POLICY "Users can view tasks for accessible projects" 
ON public.tasks FOR SELECT TO authenticated
USING (has_project_access(project_id, auth.uid()));

-- Goals table
DROP POLICY IF EXISTS "Project members can create goals" ON public.goals;
DROP POLICY IF EXISTS "Project members can update goals" ON public.goals;
DROP POLICY IF EXISTS "Project owners can delete goals" ON public.goals;
DROP POLICY IF EXISTS "Users can view goals for accessible projects" ON public.goals;

CREATE POLICY "Project members can create goals" 
ON public.goals FOR INSERT TO authenticated
WITH CHECK (has_project_access(project_id, auth.uid()));

CREATE POLICY "Project members can update goals" 
ON public.goals FOR UPDATE TO authenticated
USING (has_project_access(project_id, auth.uid()));

CREATE POLICY "Project owners can delete goals" 
ON public.goals FOR DELETE TO authenticated
USING (is_project_owner(project_id, auth.uid()));

CREATE POLICY "Users can view goals for accessible projects" 
ON public.goals FOR SELECT TO authenticated
USING (has_project_access(project_id, auth.uid()));

-- Milestones table
DROP POLICY IF EXISTS "Project members can create milestones" ON public.milestones;
DROP POLICY IF EXISTS "Project members can update milestones" ON public.milestones;
DROP POLICY IF EXISTS "Project owners can delete milestones" ON public.milestones;
DROP POLICY IF EXISTS "Users can view milestones for accessible goals" ON public.milestones;

CREATE POLICY "Project members can create milestones" 
ON public.milestones FOR INSERT TO authenticated
WITH CHECK ((EXISTS ( SELECT 1 FROM goals g WHERE ((g.id = milestones.goal_id) AND has_project_access(g.project_id, auth.uid())))));

CREATE POLICY "Project members can update milestones" 
ON public.milestones FOR UPDATE TO authenticated
USING ((EXISTS ( SELECT 1 FROM goals g WHERE ((g.id = milestones.goal_id) AND has_project_access(g.project_id, auth.uid())))));

CREATE POLICY "Project owners can delete milestones" 
ON public.milestones FOR DELETE TO authenticated
USING ((EXISTS ( SELECT 1 FROM goals g WHERE ((g.id = milestones.goal_id) AND is_project_owner(g.project_id, auth.uid())))));

CREATE POLICY "Users can view milestones for accessible goals" 
ON public.milestones FOR SELECT TO authenticated
USING ((EXISTS ( SELECT 1 FROM goals g WHERE ((g.id = milestones.goal_id) AND has_project_access(g.project_id, auth.uid())))));

-- Activities table
DROP POLICY IF EXISTS "Users can insert activities for accessible projects" ON public.activities;
DROP POLICY IF EXISTS "Users can view activities for accessible projects" ON public.activities;

CREATE POLICY "Users can insert activities for accessible projects" 
ON public.activities FOR INSERT TO authenticated
WITH CHECK ((auth.uid() = user_id) AND has_project_access(project_id, auth.uid()));

CREATE POLICY "Users can view activities for accessible projects" 
ON public.activities FOR SELECT TO authenticated
USING ((EXISTS ( SELECT 1 FROM project_members WHERE ((project_members.project_id = activities.project_id) AND (project_members.user_id = auth.uid())))));

-- Projects table
DROP POLICY IF EXISTS "Authenticated users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Project owners can delete projects" ON public.projects;
DROP POLICY IF EXISTS "Project owners can update projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view projects they have access to" ON public.projects;

CREATE POLICY "Authenticated users can create projects" 
ON public.projects FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Project owners can delete projects" 
ON public.projects FOR DELETE TO authenticated
USING (is_project_owner(id, auth.uid()));

CREATE POLICY "Project owners can update projects" 
ON public.projects FOR UPDATE TO authenticated
USING (is_project_owner(id, auth.uid()));

CREATE POLICY "Users can view projects they have access to" 
ON public.projects FOR SELECT TO authenticated
USING ((auth.uid() = user_id) OR has_project_access(id, auth.uid()));

-- Project members table
DROP POLICY IF EXISTS "Project owners can add members" ON public.project_members;
DROP POLICY IF EXISTS "Project owners can remove members" ON public.project_members;
DROP POLICY IF EXISTS "Users can view members of projects they have access to" ON public.project_members;

CREATE POLICY "Project owners can add members" 
ON public.project_members FOR INSERT TO authenticated
WITH CHECK (is_project_owner(project_id, auth.uid()));

CREATE POLICY "Project owners can remove members" 
ON public.project_members FOR DELETE TO authenticated
USING (is_project_owner(project_id, auth.uid()));

CREATE POLICY "Users can view members of projects they have access to" 
ON public.project_members FOR SELECT TO authenticated
USING (has_project_access(project_id, auth.uid()));

-- Project messages table
DROP POLICY IF EXISTS "Project members can send messages" ON public.project_messages;
DROP POLICY IF EXISTS "Project members can view messages" ON public.project_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.project_messages;

CREATE POLICY "Project members can send messages" 
ON public.project_messages FOR INSERT TO authenticated
WITH CHECK ((auth.uid() = user_id) AND has_project_access(project_id, auth.uid()));

CREATE POLICY "Project members can view messages" 
ON public.project_messages FOR SELECT TO authenticated
USING (has_project_access(project_id, auth.uid()));

CREATE POLICY "Users can delete their own messages" 
ON public.project_messages FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Profiles table
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles of collaborators" ON public.profiles;

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can view profiles of collaborators" 
ON public.profiles FOR SELECT TO authenticated
USING ((auth.uid() = user_id) OR (EXISTS ( SELECT 1 FROM (project_members pm1 JOIN project_members pm2 ON ((pm1.project_id = pm2.project_id))) WHERE ((pm1.user_id = auth.uid()) AND (pm2.user_id = profiles.user_id)))));

-- Chat messages table
DROP POLICY IF EXISTS "Users can create their own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can view their own messages" ON public.chat_messages;

CREATE POLICY "Users can create their own messages" 
ON public.chat_messages FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages" 
ON public.chat_messages FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own messages" 
ON public.chat_messages FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Scheduling history table
DROP POLICY IF EXISTS "Project members can insert scheduling history" ON public.scheduling_history;
DROP POLICY IF EXISTS "Project members can update scheduling history" ON public.scheduling_history;
DROP POLICY IF EXISTS "Project members can view scheduling history" ON public.scheduling_history;

CREATE POLICY "Project members can insert scheduling history" 
ON public.scheduling_history FOR INSERT TO authenticated
WITH CHECK ((auth.uid() = user_id) AND has_project_access(project_id, auth.uid()));

CREATE POLICY "Project members can update scheduling history" 
ON public.scheduling_history FOR UPDATE TO authenticated
USING (has_project_access(project_id, auth.uid()))
WITH CHECK (has_project_access(project_id, auth.uid()));

CREATE POLICY "Project members can view scheduling history" 
ON public.scheduling_history FOR SELECT TO authenticated
USING (has_project_access(project_id, auth.uid()));

-- Storage policies
DROP POLICY IF EXISTS "Project members can upload attachments" ON storage.objects;
DROP POLICY IF EXISTS "Project members can view attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own attachments" ON storage.objects;

CREATE POLICY "Project members can upload attachments" 
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Project members can view attachments" 
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'chat-attachments');

CREATE POLICY "Users can delete their own attachments" 
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[2]);