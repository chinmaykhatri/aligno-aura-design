import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SprintMemberCapacity {
  id: string;
  sprint_id: string;
  user_id: string;
  available_hours: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const useSprintCapacity = (sprintId: string | undefined) => {
  return useQuery({
    queryKey: ['sprint-capacity', sprintId],
    queryFn: async () => {
      if (!sprintId) return [];
      
      const { data, error } = await supabase
        .from('sprint_member_capacity')
        .select('*')
        .eq('sprint_id', sprintId);

      if (error) throw error;
      return data as SprintMemberCapacity[];
    },
    enabled: !!sprintId,
  });
};

export const useUpsertSprintCapacity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (capacity: {
      sprint_id: string;
      user_id: string;
      available_hours: number;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('sprint_member_capacity')
        .upsert(capacity, { onConflict: 'sprint_id,user_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sprint-capacity', data.sprint_id] });
      toast.success('Capacity updated');
    },
    onError: () => {
      toast.error('Failed to update capacity');
    },
  });
};

export const useDeleteSprintCapacity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, sprintId }: { id: string; sprintId: string }) => {
      const { error } = await supabase
        .from('sprint_member_capacity')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { sprintId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sprint-capacity', data.sprintId] });
      toast.success('Capacity removed');
    },
  });
};

// Calculate historical velocity from completed sprints
export const useHistoricalVelocity = (projectId: string | undefined) => {
  return useQuery({
    queryKey: ['historical-velocity', projectId],
    queryFn: async () => {
      if (!projectId) return null;

      // Get completed sprints
      const { data: sprints, error: sprintsError } = await supabase
        .from('sprints')
        .select('id, name, start_date, end_date')
        .eq('project_id', projectId)
        .eq('status', 'completed')
        .order('end_date', { ascending: false })
        .limit(5);

      if (sprintsError) throw sprintsError;
      if (!sprints || sprints.length === 0) return null;

      // Get tasks for these sprints
      const sprintIds = sprints.map(s => s.id);
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('sprint_id, status, story_points, estimated_hours')
        .in('sprint_id', sprintIds);

      if (tasksError) throw tasksError;

      // Calculate velocity per sprint
      const sprintVelocities = sprints.map(sprint => {
        const sprintTasks = tasks?.filter(t => t.sprint_id === sprint.id && t.status === 'completed') || [];
        const totalPoints = sprintTasks.reduce((sum, t) => sum + (t.story_points || 0), 0);
        const totalHours = sprintTasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
        return { 
          sprintId: sprint.id, 
          name: sprint.name,
          points: totalPoints, 
          hours: totalHours 
        };
      });

      // Calculate averages
      const avgPoints = sprintVelocities.reduce((sum, v) => sum + v.points, 0) / sprintVelocities.length;
      const avgHours = sprintVelocities.reduce((sum, v) => sum + v.hours, 0) / sprintVelocities.length;

      return {
        sprints: sprintVelocities,
        averagePoints: Math.round(avgPoints * 10) / 10,
        averageHours: Math.round(avgHours * 10) / 10,
        trend: sprintVelocities.length >= 2 
          ? sprintVelocities[0].points - sprintVelocities[sprintVelocities.length - 1].points 
          : 0,
      };
    },
    enabled: !!projectId,
  });
};
