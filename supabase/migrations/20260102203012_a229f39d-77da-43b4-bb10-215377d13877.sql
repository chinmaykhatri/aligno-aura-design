-- Create project invitations table for all invitation methods
CREATE TABLE public.project_invitations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    created_by UUID NOT NULL,
    invitation_type TEXT NOT NULL CHECK (invitation_type IN ('email', 'link', 'code')),
    email TEXT, -- For email invitations
    invite_code TEXT, -- For code-based invitations (6 chars)
    invite_token TEXT DEFAULT encode(extensions.gen_random_bytes(32), 'hex'), -- For link invitations
    role TEXT NOT NULL DEFAULT 'member',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days'),
    accepted_by UUID,
    accepted_at TIMESTAMP WITH TIME ZONE,
    max_uses INTEGER DEFAULT 1, -- For link/code: how many times it can be used
    use_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique partial indexes
CREATE UNIQUE INDEX project_invitations_email_idx ON public.project_invitations(project_id, email) WHERE status = 'pending' AND invitation_type = 'email';
CREATE UNIQUE INDEX project_invitations_code_idx ON public.project_invitations(invite_code) WHERE status = 'pending';
CREATE UNIQUE INDEX project_invitations_token_idx ON public.project_invitations(invite_token) WHERE status = 'pending';

-- Enable RLS
ALTER TABLE public.project_invitations ENABLE ROW LEVEL SECURITY;

-- Project owners can manage invitations
CREATE POLICY "Project owners can create invitations"
ON public.project_invitations
FOR INSERT
TO authenticated
WITH CHECK (is_project_owner(project_id, auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Project owners can view invitations"
ON public.project_invitations
FOR SELECT
TO authenticated
USING (is_project_owner(project_id, auth.uid()) OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Project owners can update invitations"
ON public.project_invitations
FOR UPDATE
TO authenticated
USING (is_project_owner(project_id, auth.uid()));

CREATE POLICY "Project owners can delete invitations"
ON public.project_invitations
FOR DELETE
TO authenticated
USING (is_project_owner(project_id, auth.uid()));

-- Create function to generate short invite codes
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..6 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$;

-- Create function to accept invitation
CREATE OR REPLACE FUNCTION public.accept_project_invitation(p_invite_token TEXT DEFAULT NULL, p_invite_code TEXT DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invitation RECORD;
    v_user_id UUID;
    v_result JSON;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Not authenticated');
    END IF;
    
    -- Find the invitation
    IF p_invite_token IS NOT NULL THEN
        SELECT * INTO v_invitation FROM project_invitations
        WHERE invite_token = p_invite_token AND status = 'pending'
        AND (expires_at IS NULL OR expires_at > now())
        AND (max_uses IS NULL OR use_count < max_uses);
    ELSIF p_invite_code IS NOT NULL THEN
        SELECT * INTO v_invitation FROM project_invitations
        WHERE invite_code = UPPER(p_invite_code) AND status = 'pending'
        AND (expires_at IS NULL OR expires_at > now())
        AND (max_uses IS NULL OR use_count < max_uses);
    ELSE
        RETURN json_build_object('success', false, 'error', 'No invitation token or code provided');
    END IF;
    
    IF v_invitation IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Invalid or expired invitation');
    END IF;
    
    -- Check if user is already a member
    IF EXISTS (SELECT 1 FROM project_members WHERE project_id = v_invitation.project_id AND user_id = v_user_id) THEN
        RETURN json_build_object('success', false, 'error', 'You are already a member of this project');
    END IF;
    
    -- Add user to project
    INSERT INTO project_members (project_id, user_id, role)
    VALUES (v_invitation.project_id, v_user_id, v_invitation.role);
    
    -- Update invitation
    UPDATE project_invitations
    SET use_count = use_count + 1,
        accepted_by = v_user_id,
        accepted_at = now(),
        status = CASE 
            WHEN invitation_type = 'email' THEN 'accepted'
            WHEN max_uses IS NOT NULL AND use_count + 1 >= max_uses THEN 'accepted'
            ELSE status
        END,
        updated_at = now()
    WHERE id = v_invitation.id;
    
    RETURN json_build_object(
        'success', true, 
        'project_id', v_invitation.project_id,
        'message', 'Successfully joined the project'
    );
END;
$$;

-- Trigger to update updated_at
CREATE TRIGGER update_project_invitations_updated_at
    BEFORE UPDATE ON public.project_invitations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();