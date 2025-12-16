import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { createActivity, ActivityType } from './useActivities';

export interface Task {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  estimated_hours: number | null;
  tracked_hours: number | null;
  assigned_to: string | null;
  baseline_due_date: string | null;
  baseline_estimated_hours: number | null;
  created_at: string;
  updated_at: string;
}

export const useTasks = (projectId: string | undefined) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('due_date', { ascending: true, nullsFirst: false });

      if (error) throw error;
      return data as Task[];
    },
    enabled: !!projectId,
  });

  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`tasks-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

  return query;
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (task: {
      project_id: string;
      title: string;
      description?: string;
      priority?: string;
      due_date?: string;
      estimated_hours?: number;
      assigned_to?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...task,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      await createActivity({
        user_id: user.id,
        project_id: task.project_id,
        activity_type: 'task_created' as ActivityType,
        metadata: { task_title: task.title },
      });

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', data.project_id] });
      toast.success('Task created successfully');
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId, ...updates }: {
      id: string;
      projectId: string;
      title?: string;
      description?: string;
      status?: string;
      priority?: string;
      due_date?: string | null;
      estimated_hours?: number | null;
      tracked_hours?: number | null;
      assigned_to?: string | null;
      baseline_due_date?: string | null;
      baseline_estimated_hours?: number | null;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const activityType: ActivityType = updates.status === 'completed' ? 'task_completed' : 'task_updated';
      await createActivity({
        user_id: user.id,
        project_id: projectId,
        activity_type: activityType,
        metadata: { task_title: data.title },
      });

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', data.project_id] });
      toast.success('Task updated successfully');
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId, title }: { id: string; projectId: string; title: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await createActivity({
        user_id: user.id,
        project_id: projectId,
        activity_type: 'task_deleted' as ActivityType,
        metadata: { task_title: title },
      });

      return { projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', data.projectId] });
      toast.success('Task deleted successfully');
    },
  });
};

export const useLogTime = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId, hours }: { id: string; projectId: string; hours: number }) => {
      const { data: task } = await supabase
        .from('tasks')
        .select('tracked_hours')
        .eq('id', id)
        .single();

      const currentHours = task?.tracked_hours || 0;
      const newHours = Number(currentHours) + hours;

      const { data, error } = await supabase
        .from('tasks')
        .update({ tracked_hours: newHours })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', data.project_id] });
      toast.success('Time logged successfully');
    },
  });
};
