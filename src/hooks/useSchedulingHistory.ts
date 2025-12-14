import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SchedulingHistoryEntry {
  id: string;
  project_id: string;
  user_id: string;
  task_id: string | null;
  task_title: string;
  action_type: 'schedule' | 'reassignment';
  details: {
    suggestedDate?: string;
    timeBlock?: string;
    reason?: string;
    previousAssignee?: string | null;
    newAssignee?: string;
  };
  created_at: string;
  appliedByName?: string;
}

export const useSchedulingHistory = (projectId?: string) => {
  const queryClient = useQueryClient();

  const { data: history, isLoading } = useQuery({
    queryKey: ['scheduling-history', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      // First get the history entries
      const { data: historyData, error } = await supabase
        .from('scheduling_history')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      if (!historyData) return [];

      // Get unique user IDs and fetch their profiles
      const userIds = [...new Set(historyData.map(h => h.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);

      return historyData.map(entry => ({
        ...entry,
        action_type: entry.action_type as 'schedule' | 'reassignment',
        details: entry.details as SchedulingHistoryEntry['details'],
        appliedByName: profileMap.get(entry.user_id) || 'Unknown',
      })) as SchedulingHistoryEntry[];
    },
    enabled: !!projectId,
  });

  const logSchedulingAction = useMutation({
    mutationFn: async ({
      projectId,
      taskId,
      taskTitle,
      actionType,
      details,
    }: {
      projectId: string;
      taskId: string;
      taskTitle: string;
      actionType: 'schedule' | 'reassignment';
      details: SchedulingHistoryEntry['details'];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('scheduling_history')
        .insert({
          project_id: projectId,
          user_id: user.id,
          task_id: taskId,
          task_title: taskTitle,
          action_type: actionType,
          details,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduling-history', projectId] });
    },
  });

  return {
    history: history || [],
    isLoading,
    logSchedulingAction: logSchedulingAction.mutateAsync,
  };
};
