import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ProjectInvitation {
  id: string;
  project_id: string;
  created_by: string;
  invitation_type: 'email' | 'link' | 'code';
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
      role = 'member' 
    }: { 
      projectId: string; 
      email: string; 
      role?: string;
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
      
      // Send invitation email
      await supabase.functions.invoke('send-notification-email', {
        body: {
          type: 'member_invitation',
          recipientEmail: email,
          data: {
            projectId,
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
    mutationFn: async ({ token, code }: { token?: string; code?: string }) => {
      const { data, error } = await supabase.rpc('accept_project_invitation', {
        p_invite_token: token || null,
        p_invite_code: code || null,
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; project_id?: string; message?: string };
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to accept invitation');
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
