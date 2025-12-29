import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ClientPortalToken {
  id: string;
  project_id: string;
  user_id: string;
  token: string;
  name: string;
  expires_at: string | null;
  is_active: boolean;
  views_count: number;
  last_viewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useClientPortalTokens = (projectId: string) => {
  return useQuery({
    queryKey: ['client-portal-tokens', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_portal_tokens')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ClientPortalToken[];
    },
    enabled: !!projectId,
  });
};

export const useCreatePortalToken = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ projectId, name, expiresAt }: { 
      projectId: string; 
      name: string; 
      expiresAt?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('client_portal_tokens')
        .insert({
          project_id: projectId,
          user_id: user.id,
          name,
          expires_at: expiresAt || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ClientPortalToken;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-portal-tokens', variables.projectId] });
      toast({
        title: 'Link Created',
        description: 'Client portal link has been created',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create portal link',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdatePortalToken = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, projectId, updates }: { 
      id: string;
      projectId: string;
      updates: Partial<Pick<ClientPortalToken, 'name' | 'is_active' | 'expires_at'>>;
    }) => {
      const { data, error } = await supabase
        .from('client_portal_tokens')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ClientPortalToken;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-portal-tokens', variables.projectId] });
      toast({
        title: 'Link Updated',
        description: 'Client portal link has been updated',
      });
    },
  });
};

export const useDeletePortalToken = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase
        .from('client_portal_tokens')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-portal-tokens', variables.projectId] });
      toast({
        title: 'Link Deleted',
        description: 'Client portal link has been removed',
      });
    },
  });
};
