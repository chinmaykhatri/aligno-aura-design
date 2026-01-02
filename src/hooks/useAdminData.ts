import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from './useUserRole';
import { toast } from 'sonner';

export interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'admin' | 'moderator' | 'user';
  role_id: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  is_suspended: boolean;
  banned_until: string | null;
}

export interface AdminProject {
  id: string;
  name: string;
  description: string | null;
  status: string;
  progress: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  member_count: number;
  owner_id: string;
  owner_email: string | null;
  owner_name: string | null;
}

export const useAdminUsers = () => {
  const { isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('admin-users', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return data.users as AdminUser[];
    },
    enabled: isAdmin,
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('admin-users', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { userId },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete user');
    },
  });
};

export const useSuspendUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, action }: { userId: string; action: 'suspend' | 'unsuspend' }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('admin-users', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { userId, action },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(variables.action === 'suspend' ? 'User suspended successfully' : 'User unsuspended successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update user status');
    },
  });
};

export const useAdminProjects = () => {
  const { isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ['admin-projects'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('admin-projects', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return data.projects as AdminProject[];
    },
    enabled: isAdmin,
  });
};
