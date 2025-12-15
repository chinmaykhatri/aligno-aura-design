import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TaskDependency {
  id: string;
  task_id: string;
  depends_on_task_id: string;
  created_at: string;
}

export const useTaskDependencies = (projectId?: string) => {
  return useQuery({
    queryKey: ['task-dependencies', projectId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Fetch all dependencies for tasks in the project(s)
      let query = supabase
        .from('task_dependencies')
        .select(`
          *,
          task:task_id (project_id),
          depends_on:depends_on_task_id (project_id)
        `);

      const { data, error } = await query;
      if (error) throw error;

      // Filter by project if specified
      if (projectId) {
        return (data || []).filter(
          (d: any) => d.task?.project_id === projectId
        ) as TaskDependency[];
      }

      return (data || []) as TaskDependency[];
    },
  });
};

export const useCreateDependency = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, dependsOnTaskId }: { taskId: string; dependsOnTaskId: string }) => {
      const { data, error } = await supabase
        .from('task_dependencies')
        .insert({
          task_id: taskId,
          depends_on_task_id: dependsOnTaskId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-dependencies'] });
      toast.success('Dependency created');
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error('This dependency already exists');
      } else {
        toast.error('Failed to create dependency');
      }
    },
  });
};

export const useDeleteDependency = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dependencyId: string) => {
      const { error } = await supabase
        .from('task_dependencies')
        .delete()
        .eq('id', dependencyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-dependencies'] });
      toast.success('Dependency removed');
    },
    onError: () => {
      toast.error('Failed to remove dependency');
    },
  });
};