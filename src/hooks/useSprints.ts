import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect } from 'react';

export interface Sprint {
  id: string;
  project_id: string;
  name: string;
  goal: string | null;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const useSprints = (projectId: string | undefined) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['sprints', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('sprints')
        .select('*')
        .eq('project_id', projectId)
        .order('start_date', { ascending: true });

      if (error) throw error;
      return data as Sprint[];
    },
    enabled: !!projectId,
  });

  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`sprints-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sprints',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

  return query;
};

export const useCreateSprint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sprint: {
      project_id: string;
      name: string;
      goal?: string;
      start_date: string;
      end_date: string;
    }) => {
      const { data, error } = await supabase
        .from('sprints')
        .insert(sprint)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sprints', data.project_id] });
      toast.success('Sprint created successfully');
    },
  });
};

export const useUpdateSprint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId, ...updates }: {
      id: string;
      projectId: string;
      name?: string;
      goal?: string | null;
      start_date?: string;
      end_date?: string;
      status?: string;
    }) => {
      const { data, error } = await supabase
        .from('sprints')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sprints', data.project_id] });
      toast.success('Sprint updated successfully');
    },
  });
};

export const useDeleteSprint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase
        .from('sprints')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sprints', data.projectId] });
      toast.success('Sprint deleted successfully');
    },
  });
};

export const useAssignTaskToSprint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, sprintId, projectId }: { 
      taskId: string; 
      sprintId: string | null;
      projectId: string;
    }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update({ sprint_id: sprintId })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return { ...data, projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', data.projectId] });
      queryClient.invalidateQueries({ queryKey: ['sprints', data.projectId] });
      toast.success(data.sprint_id ? 'Task added to sprint' : 'Task removed from sprint');
    },
  });
};
