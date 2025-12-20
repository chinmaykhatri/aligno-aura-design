import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SprintTemplate {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  duration_days: number;
  goal_template: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export const useSprintTemplates = (projectId: string | undefined) => {
  return useQuery({
    queryKey: ['sprint-templates', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('sprint_templates')
        .select('*')
        .eq('project_id', projectId)
        .order('is_default', { ascending: false })
        .order('name', { ascending: true });

      if (error) throw error;
      return data as SprintTemplate[];
    },
    enabled: !!projectId,
  });
};

export const useCreateSprintTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: {
      project_id: string;
      name: string;
      duration_days: number;
      goal_template?: string;
      is_default?: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('sprint_templates')
        .insert({
          ...template,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sprint-templates', data.project_id] });
      toast.success('Template created successfully');
    },
    onError: () => {
      toast.error('Failed to create template');
    },
  });
};

export const useUpdateSprintTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId, ...updates }: {
      id: string;
      projectId: string;
      name?: string;
      duration_days?: number;
      goal_template?: string | null;
      is_default?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('sprint_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { ...data, projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sprint-templates', data.projectId] });
      toast.success('Template updated successfully');
    },
  });
};

export const useDeleteSprintTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase
        .from('sprint_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sprint-templates', data.projectId] });
      toast.success('Template deleted successfully');
    },
  });
};
