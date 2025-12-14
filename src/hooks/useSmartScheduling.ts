import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { sendSchedulingAppliedNotification } from '@/lib/emailNotifications';
import { useSchedulingHistory } from '@/hooks/useSchedulingHistory';

export interface SchedulingSuggestion {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  taskIds?: string[];
}

export interface ScheduleItem {
  taskId: string;
  taskTitle: string;
  suggestedDate: string;
  suggestedTimeBlock: 'morning' | 'afternoon' | 'evening';
  reason: string;
  applied?: boolean;
}

export interface WorkloadAnalysis {
  analysis: {
    overloaded: string[];
    underutilized: string[];
  };
  reassignments: {
    taskId: string;
    taskTitle: string;
    currentAssignee: string | null;
    suggestedAssignee: string;
    suggestedAssigneeId?: string;
    reason: string;
    applied?: boolean;
  }[];
}

export interface DeadlineAlert {
  taskId: string;
  taskTitle: string;
  alertLevel: 'critical' | 'warning' | 'info';
  dueDate: string;
  daysRemaining: number;
  message: string;
  suggestedAction: string;
}

interface Task {
  id: string;
  title: string;
  priority: string;
  status: string;
  due_date: string | null;
  estimated_hours: number | null;
  tracked_hours: number | null;
  assigned_to: string | null;
}

interface TeamMember {
  user_id: string;
  full_name: string | null;
  role: string;
}

export const useSmartScheduling = (projectId?: string, projectName?: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SchedulingSuggestion[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [workload, setWorkload] = useState<WorkloadAnalysis | null>(null);
  const [alerts, setAlerts] = useState<DeadlineAlert[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { history, isLoading: historyLoading, logSchedulingAction, undoSchedulingAction, isUndoing } = useSchedulingHistory(projectId);

  const sendNotification = async (
    teamMembers: TeamMember[],
    taskTitle: string,
    schedulingType: 'schedule' | 'reassignment',
    details: string
  ) => {
    try {
      // Get current user info
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserName = user?.email || 'Team member';
      
      // Send notification to all team members (except current user)
      for (const member of teamMembers) {
        if (member.user_id === user?.id) continue;
        
        // Get member email from profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', member.user_id)
          .single();
        
        // We need the email - fetch from auth if available via edge function
        // For now, we'll log that notification was attempted
        console.log(`Would notify ${member.full_name || member.user_id} about scheduling: ${taskTitle}`);
      }
    } catch (error) {
      console.error('Error sending scheduling notification:', error);
    }
  };

  const fetchSchedulingData = async (
    type: 'suggestions' | 'auto-schedule' | 'workload' | 'deadline-alerts',
    tasks: Task[],
    teamMembers: TeamMember[],
    projectId: string
  ) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('smart-scheduling', {
        body: { type, tasks, teamMembers, projectId }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      const result = data.result;

      switch (type) {
        case 'suggestions':
          setSuggestions(result.suggestions || []);
          break;
        case 'auto-schedule':
          setSchedule((result.schedule || []).map((s: ScheduleItem) => ({ ...s, applied: false })));
          break;
        case 'workload':
          setWorkload({
            ...result,
            reassignments: (result.reassignments || []).map((r: WorkloadAnalysis['reassignments'][0]) => ({ ...r, applied: false }))
          });
          break;
        case 'deadline-alerts':
          setAlerts(result.alerts || []);
          break;
      }

      return result;
    } catch (error: any) {
      console.error('Smart scheduling error:', error);
      toast({
        title: 'Scheduling Error',
        description: error.message || 'Failed to get scheduling data',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const applyScheduleItem = async (item: ScheduleItem, teamMembers?: TeamMember[]) => {
    setIsApplying(item.taskId);
    try {
      // Get current due_date before updating
      const { data: currentTask } = await supabase
        .from('tasks')
        .select('due_date')
        .eq('id', item.taskId)
        .single();

      const previousDueDate = currentTask?.due_date || null;

      const { error } = await supabase
        .from('tasks')
        .update({ due_date: item.suggestedDate })
        .eq('id', item.taskId);

      if (error) throw error;

      setSchedule(prev => prev.map(s => 
        s.taskId === item.taskId ? { ...s, applied: true } : s
      ));

      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
        
        // Log to history with previous value for undo
        await logSchedulingAction({
          projectId,
          taskId: item.taskId,
          taskTitle: item.taskTitle,
          actionType: 'schedule',
          details: {
            suggestedDate: item.suggestedDate,
            timeBlock: item.suggestedTimeBlock,
            reason: item.reason,
          },
          previousValue: {
            due_date: previousDueDate,
          },
        });
      }

      // Send notification to team members
      if (teamMembers && projectName) {
        sendNotification(
          teamMembers,
          item.taskTitle,
          'schedule',
          `Scheduled for ${item.suggestedDate} (${item.suggestedTimeBlock}). Reason: ${item.reason}`
        );
      }

      toast({
        title: 'Schedule Applied',
        description: `"${item.taskTitle}" scheduled for ${item.suggestedDate}`,
      });
    } catch (error: any) {
      console.error('Apply schedule error:', error);
      toast({
        title: 'Failed to Apply',
        description: error.message || 'Could not apply schedule',
        variant: 'destructive',
      });
    } finally {
      setIsApplying(null);
    }
  };

  const applyReassignment = async (reassignment: WorkloadAnalysis['reassignments'][0], teamMembers: TeamMember[]) => {
    setIsApplying(reassignment.taskId);
    try {
      // Get current assigned_to before updating
      const { data: currentTask } = await supabase
        .from('tasks')
        .select('assigned_to')
        .eq('id', reassignment.taskId)
        .single();

      const previousAssignedTo = currentTask?.assigned_to || null;

      // Find the user_id for the suggested assignee
      const assignee = teamMembers.find(m => 
        m.full_name?.toLowerCase() === reassignment.suggestedAssignee.toLowerCase() ||
        m.user_id === reassignment.suggestedAssigneeId
      );

      if (!assignee) {
        throw new Error(`Could not find team member: ${reassignment.suggestedAssignee}`);
      }

      const { error } = await supabase
        .from('tasks')
        .update({ assigned_to: assignee.user_id })
        .eq('id', reassignment.taskId);

      if (error) throw error;

      setWorkload(prev => prev ? {
        ...prev,
        reassignments: prev.reassignments.map(r => 
          r.taskId === reassignment.taskId ? { ...r, applied: true } : r
        )
      } : null);

      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
        
        // Log to history with previous value for undo
        await logSchedulingAction({
          projectId,
          taskId: reassignment.taskId,
          taskTitle: reassignment.taskTitle,
          actionType: 'reassignment',
          details: {
            previousAssignee: reassignment.currentAssignee,
            newAssignee: reassignment.suggestedAssignee,
            reason: reassignment.reason,
          },
          previousValue: {
            assigned_to: previousAssignedTo,
          },
        });
      }

      // Send notification to team members
      if (projectName) {
        sendNotification(
          teamMembers,
          reassignment.taskTitle,
          'reassignment',
          `Reassigned from ${reassignment.currentAssignee || 'Unassigned'} to ${reassignment.suggestedAssignee}. Reason: ${reassignment.reason}`
        );
      }

      toast({
        title: 'Reassignment Applied',
        description: `"${reassignment.taskTitle}" assigned to ${reassignment.suggestedAssignee}`,
      });
    } catch (error: any) {
      console.error('Apply reassignment error:', error);
      toast({
        title: 'Failed to Apply',
        description: error.message || 'Could not apply reassignment',
        variant: 'destructive',
      });
    } finally {
      setIsApplying(null);
    }
  };

  const applyAllSchedule = async (teamMembers?: TeamMember[]) => {
    const unapplied = schedule.filter(s => !s.applied);
    for (const item of unapplied) {
      await applyScheduleItem(item, teamMembers);
    }
  };

  const applyAllReassignments = async (teamMembers: TeamMember[]) => {
    if (!workload) return;
    const unapplied = workload.reassignments.filter(r => !r.applied);
    for (const item of unapplied) {
      await applyReassignment(item, teamMembers);
    }
  };

  const clearData = () => {
    setSuggestions([]);
    setSchedule([]);
    setWorkload(null);
    setAlerts([]);
  };

  return {
    isLoading,
    isApplying,
    suggestions,
    schedule,
    workload,
    alerts,
    history,
    historyLoading,
    isUndoing,
    fetchSchedulingData,
    applyScheduleItem,
    applyReassignment,
    applyAllSchedule,
    applyAllReassignments,
    undoSchedulingAction,
    clearData,
  };
};
