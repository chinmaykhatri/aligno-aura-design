import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  previous_value: {
    due_date?: string | null;
    assigned_to?: string | null;
  };
  undone: boolean;
  undone_at: string | null;
  created_at: string;
  appliedByName?: string;
}

export const useSchedulingHistory = (projectId?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: history, isLoading } = useQuery({
    queryKey: ['scheduling-history', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data: historyData, error } = await supabase
        .from('scheduling_history')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      if (!historyData) return [];

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
        previous_value: (entry.previous_value || {}) as SchedulingHistoryEntry['previous_value'],
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
      previousValue,
    }: {
      projectId: string;
      taskId: string;
      taskTitle: string;
      actionType: 'schedule' | 'reassignment';
      details: SchedulingHistoryEntry['details'];
      previousValue: SchedulingHistoryEntry['previous_value'];
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
          previous_value: previousValue,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduling-history', projectId] });
    },
  });

  const undoSchedulingAction = useMutation({
    mutationFn: async (entry: SchedulingHistoryEntry) => {
      if (!entry.task_id) throw new Error('Task no longer exists');
      if (entry.undone) throw new Error('Already undone');

      // Revert the task to previous state
      if (entry.action_type === 'schedule') {
        const { error } = await supabase
          .from('tasks')
          .update({ due_date: entry.previous_value.due_date || null })
          .eq('id', entry.task_id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tasks')
          .update({ assigned_to: entry.previous_value.assigned_to || null })
          .eq('id', entry.task_id);
        if (error) throw error;
      }

      // Mark history entry as undone
      const { error: updateError } = await supabase
        .from('scheduling_history')
        .update({ undone: true, undone_at: new Date().toISOString() })
        .eq('id', entry.id);

      if (updateError) throw updateError;
    },
    onSuccess: (_, entry) => {
      queryClient.invalidateQueries({ queryKey: ['scheduling-history', projectId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      toast({
        title: 'Change Undone',
        description: `Reverted "${entry.task_title}" to previous state`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Undo Failed',
        description: error.message || 'Could not undo the change',
        variant: 'destructive',
      });
    },
  });

  return {
    history: history || [],
    isLoading,
    logSchedulingAction: logSchedulingAction.mutateAsync,
    undoSchedulingAction: undoSchedulingAction.mutateAsync,
    isUndoing: undoSchedulingAction.isPending,
  };
};
