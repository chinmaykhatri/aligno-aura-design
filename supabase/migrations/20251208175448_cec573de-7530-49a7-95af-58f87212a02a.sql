-- Fix 1: Restrict profile visibility to collaborators only
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON profiles;

CREATE POLICY "Users can view profiles of collaborators"
ON profiles FOR SELECT
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM project_members pm1
    JOIN project_members pm2 ON pm1.project_id = pm2.project_id
    WHERE pm1.user_id = auth.uid()
    AND pm2.user_id = profiles.user_id
  )
);

-- Fix 2: Create secure activity logging function
CREATE OR REPLACE FUNCTION public.log_activity(
  p_project_id uuid,
  p_activity_type activity_type,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_activity_id uuid;
BEGIN
  -- Verify user has project access before logging
  IF NOT has_project_access(p_project_id, auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: user does not have access to this project';
  END IF;
  
  INSERT INTO activities (project_id, user_id, activity_type, metadata)
  VALUES (p_project_id, auth.uid(), p_activity_type, p_metadata)
  RETURNING id INTO v_activity_id;
  
  RETURN v_activity_id;
END;
$$;

-- Remove the permissive INSERT policy and create a proper one
DROP POLICY IF EXISTS "Service role can insert activities" ON activities;

CREATE POLICY "Users can insert activities for accessible projects"
ON activities FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  has_project_access(project_id, auth.uid())
);