import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ProjectInvitation {
  id: string;
  project_id: string;
  created_by: string;
  invitation_type: 'email' | 'link' | 'code' | 'access_request';
  email: string | null;
  invite_code: string | null;
  invite_token: string | null;
  role: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  expires_at: string | null;
  max_uses: number | null;
  use_count: number;
  created_at: string;
}

export const useProjectInvitations = (projectId: string) => {
  return useQuery({
    queryKey: ['project-invitations', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_invitations')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ProjectInvitation[];
    },
    enabled: !!projectId,
  });
};

export const useCreateEmailInvitation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      projectId, 
      email, 
      role = 'member',
      projectName,
      projectDescription,
      inviterName
    }: { 
      projectId: string; 
      email: string; 
      role?: string;
      projectName?: string;
      projectDescription?: string;
      inviterName?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('project_invitations')
        .insert({
          project_id: projectId,
          created_by: user.id,
          invitation_type: 'email',
          email: email.toLowerCase().trim(),
          role,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Build invite link
      const inviteLink = `${window.location.origin}/join?token=${data.invite_token}`;
      
      // Send invitation email with proper branding
      await supabase.functions.invoke('send-notification-email', {
        body: {
          type: 'member_invitation',
          recipientEmail: email,
          data: {
            projectId,
            projectName: projectName || 'a project',
            projectDescription,
            role,
            invitedBy: inviterName || 'A team member',
            inviteLink,
            inviteToken: data.invite_token,
          }
        }
      });
      
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-invitations', variables.projectId] });
      toast.success('Invitation email sent!');
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate')) {
        toast.error('An invitation has already been sent to this email');
      } else {
        toast.error('Failed to send invitation');
      }
    },
  });
};

export const useCreateLinkInvitation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      projectId, 
      role = 'member',
      maxUses = null,
      expiresInDays = 7
    }: { 
      projectId: string; 
      role?: string;
      maxUses?: number | null;
      expiresInDays?: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      const { data, error } = await supabase
        .from('project_invitations')
        .insert({
          project_id: projectId,
          created_by: user.id,
          invitation_type: 'link',
          role,
          max_uses: maxUses,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as ProjectInvitation;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-invitations', variables.projectId] });
      toast.success('Invite link created!');
    },
    onError: () => {
      toast.error('Failed to create invite link');
    },
  });
};

export const useCreateCodeInvitation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      projectId, 
      role = 'member',
      maxUses = 1
    }: { 
      projectId: string; 
      role?: string;
      maxUses?: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Generate invite code
      const { data: codeData } = await supabase.rpc('generate_invite_code');
      
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { data, error } = await supabase
        .from('project_invitations')
        .insert({
          project_id: projectId,
          created_by: user.id,
          invitation_type: 'code',
          invite_code: codeData,
          role,
          max_uses: maxUses,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as ProjectInvitation;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-invitations', variables.projectId] });
      toast.success('Invite code created!');
    },
    onError: () => {
      toast.error('Failed to create invite code');
    },
  });
};

export const useRevokeInvitation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ invitationId, projectId }: { invitationId: string; projectId: string }) => {
      const { error } = await supabase
        .from('project_invitations')
        .update({ status: 'revoked', updated_at: new Date().toISOString() })
        .eq('id', invitationId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-invitations', variables.projectId] });
      toast.success('Invitation revoked');
    },
    onError: () => {
      toast.error('Failed to revoke invitation');
    },
  });
};

export const useAcceptInvitation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      token, 
      code,
      projectName,
      ownerEmail,
      ownerName,
      memberName,
      memberEmail,
      joinMethod
    }: { 
      token?: string; 
      code?: string;
      projectName?: string;
      ownerEmail?: string;
      ownerName?: string;
      memberName?: string;
      memberEmail?: string;
      joinMethod?: string;
    }) => {
      const { data, error } = await supabase.rpc('accept_project_invitation', {
        p_invite_token: token || null,
        p_invite_code: code || null,
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; project_id?: string; message?: string };
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to accept invitation');
      }
      
      // Send notification to project owner if we have their email
      if (ownerEmail && projectName && memberName) {
        await supabase.functions.invoke('send-notification-email', {
          body: {
            type: 'member_joined',
            recipientEmail: ownerEmail,
            recipientName: ownerName,
            data: {
              projectName,
              memberName,
              memberEmail,
              role: 'member',
              joinMethod: joinMethod || 'Invitation',
            }
          }
        }).catch(err => console.error('Failed to send join notification:', err));
      }
      
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project-members'] });
      toast.success(data.message || 'Successfully joined the project!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

// Access Request Hooks
export const useCreateAccessRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      projectId,
      projectName,
      ownerEmail,
      ownerName,
      requesterName,
      requesterEmail,
      message
    }: { 
      projectId: string;
      projectName?: string;
      ownerEmail?: string;
      ownerName?: string;
      requesterName?: string;
      requesterEmail?: string;
      message?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('project_invitations')
        .insert({
          project_id: projectId,
          created_by: user.id,
          invitation_type: 'access_request',
          role: 'member',
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Send notification to project owner
      if (ownerEmail && projectName) {
        const dashboardLink = `${window.location.origin}/projects/${projectId}`;
        await supabase.functions.invoke('send-notification-email', {
          body: {
            type: 'access_request',
            recipientEmail: ownerEmail,
            recipientName: ownerName,
            data: {
              projectName,
              requesterName: requesterName || 'A user',
              requesterEmail: requesterEmail || user.email,
              message,
              dashboardLink,
            }
          }
        }).catch(err => console.error('Failed to send access request notification:', err));
      }
      
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-invitations', variables.projectId] });
      toast.success('Access request sent! The project owner will review it.');
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate')) {
        toast.error('You already have a pending request for this project');
      } else {
        toast.error('Failed to send access request');
      }
    },
  });
};

export const useApproveAccessRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      invitationId,
      projectId,
      projectName,
      requesterEmail,
      requesterName,
      approverName
    }: { 
      invitationId: string;
      projectId: string;
      projectName?: string;
      requesterEmail?: string;
      requesterName?: string;
      approverName?: string;
    }) => {
      const { data, error } = await supabase.rpc('approve_access_request', {
        p_invitation_id: invitationId,
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; project_id?: string; user_id?: string; message?: string };
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to approve request');
      }
      
      // Send approval notification to requester
      if (requesterEmail && projectName) {
        const projectLink = `${window.location.origin}/projects/${projectId}`;
        await supabase.functions.invoke('send-notification-email', {
          body: {
            type: 'access_request_approved',
            recipientEmail: requesterEmail,
            recipientName: requesterName,
            data: {
              projectName,
              role: 'member',
              approvedBy: approverName || 'Project owner',
              projectLink,
            }
          }
        }).catch(err => console.error('Failed to send approval notification:', err));
      }
      
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-invitations', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-members', variables.projectId] });
      toast.success('Access request approved!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useDenyAccessRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      invitationId,
      projectId,
      projectName,
      requesterEmail,
      requesterName
    }: { 
      invitationId: string;
      projectId: string;
      projectName?: string;
      requesterEmail?: string;
      requesterName?: string;
    }) => {
      const { data, error } = await supabase.rpc('deny_access_request', {
        p_invitation_id: invitationId,
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; message?: string };
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to deny request');
      }
      
      // Send denial notification to requester
      if (requesterEmail && projectName) {
        await supabase.functions.invoke('send-notification-email', {
          body: {
            type: 'access_request_denied',
            recipientEmail: requesterEmail,
            recipientName: requesterName,
            data: {
              projectName,
            }
          }
        }).catch(err => console.error('Failed to send denial notification:', err));
      }
      
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-invitations', variables.projectId] });
      toast.success('Access request denied');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const usePendingAccessRequests = (projectId: string) => {
  return useQuery({
    queryKey: ['access-requests', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_invitations')
        .select('*')
        .eq('project_id', projectId)
        .eq('invitation_type', 'access_request')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ProjectInvitation[];
    },
    enabled: !!projectId,
  });
};
