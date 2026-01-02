-- Add access_request invitation type support
-- Update the project_invitations table to support access requests

-- Add policy for users to create access requests (anyone authenticated can request to join)
CREATE POLICY "Authenticated users can create access requests"
ON public.project_invitations
FOR INSERT TO authenticated
WITH CHECK (
  invitation_type = 'access_request' 
  AND created_by = auth.uid()
);

-- Add policy for users to view their own access requests
CREATE POLICY "Users can view their own access requests"
ON public.project_invitations
FOR SELECT TO authenticated
USING (
  invitation_type = 'access_request' 
  AND created_by = auth.uid()
);

-- Create function to handle access request approval
CREATE OR REPLACE FUNCTION public.approve_access_request(p_invitation_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invitation RECORD;
    v_result JSON;
BEGIN
    -- Find the invitation and verify ownership
    SELECT * INTO v_invitation FROM project_invitations
    WHERE id = p_invitation_id 
    AND invitation_type = 'access_request'
    AND status = 'pending';
    
    IF v_invitation IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Invalid or already processed request');
    END IF;
    
    -- Verify the current user is project owner
    IF NOT is_project_owner(v_invitation.project_id, auth.uid()) THEN
        RETURN json_build_object('success', false, 'error', 'Only project owners can approve requests');
    END IF;
    
    -- Check if requester is already a member
    IF EXISTS (SELECT 1 FROM project_members WHERE project_id = v_invitation.project_id AND user_id = v_invitation.created_by) THEN
        -- Update invitation status to expired
        UPDATE project_invitations
        SET status = 'expired', updated_at = now()
        WHERE id = p_invitation_id;
        
        RETURN json_build_object('success', false, 'error', 'User is already a member of this project');
    END IF;
    
    -- Add requester to project
    INSERT INTO project_members (project_id, user_id, role)
    VALUES (v_invitation.project_id, v_invitation.created_by, v_invitation.role);
    
    -- Update invitation status
    UPDATE project_invitations
    SET status = 'accepted',
        accepted_by = v_invitation.created_by,
        accepted_at = now(),
        updated_at = now()
    WHERE id = p_invitation_id;
    
    RETURN json_build_object(
        'success', true,
        'project_id', v_invitation.project_id,
        'user_id', v_invitation.created_by,
        'message', 'Access request approved'
    );
END;
$$;

-- Create function to deny access request
CREATE OR REPLACE FUNCTION public.deny_access_request(p_invitation_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invitation RECORD;
BEGIN
    -- Find the invitation
    SELECT * INTO v_invitation FROM project_invitations
    WHERE id = p_invitation_id 
    AND invitation_type = 'access_request'
    AND status = 'pending';
    
    IF v_invitation IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Invalid or already processed request');
    END IF;
    
    -- Verify the current user is project owner
    IF NOT is_project_owner(v_invitation.project_id, auth.uid()) THEN
        RETURN json_build_object('success', false, 'error', 'Only project owners can deny requests');
    END IF;
    
    -- Update invitation status to revoked (denied)
    UPDATE project_invitations
    SET status = 'revoked', updated_at = now()
    WHERE id = p_invitation_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Access request denied'
    );
END;
$$;