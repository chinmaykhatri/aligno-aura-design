-- Add policy to allow project members to update scheduling history (for undo)
CREATE POLICY "Project members can update scheduling history"
ON public.scheduling_history
FOR UPDATE
USING (has_project_access(project_id, auth.uid()))
WITH CHECK (has_project_access(project_id, auth.uid()));