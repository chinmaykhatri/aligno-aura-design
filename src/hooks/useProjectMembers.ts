import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProjectMemberWithProfile {
  id: string;
  project_id: string;
  user_id: string;
  role: string;
  created_at: string;
  full_name: string | null;
  avatar_url: string | null;
}

export const useProjectMembers = (projectId: string | undefined) => {
  return useQuery({
    queryKey: ['project-members', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('project_members')
        .select(`
          id,
          project_id,
          user_id,
          role,
          created_at,
          profiles (
            full_name,
            avatar_url
          )
        `)
        .eq('project_id', projectId);

      if (error) throw error;

      return (data || []).map(member => ({
        id: member.id,
        project_id: member.project_id,
        user_id: member.user_id,
        role: member.role,
        created_at: member.created_at,
        full_name: (member.profiles as any)?.full_name || null,
        avatar_url: (member.profiles as any)?.avatar_url || null,
      })) as ProjectMemberWithProfile[];
    },
    enabled: !!projectId,
  });
};
