import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
    reason: string;
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

export const useSmartScheduling = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SchedulingSuggestion[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [workload, setWorkload] = useState<WorkloadAnalysis | null>(null);
  const [alerts, setAlerts] = useState<DeadlineAlert[]>([]);
  const { toast } = useToast();

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
          setSchedule(result.schedule || []);
          break;
        case 'workload':
          setWorkload(result);
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

  const clearData = () => {
    setSuggestions([]);
    setSchedule([]);
    setWorkload(null);
    setAlerts([]);
  };

  return {
    isLoading,
    suggestions,
    schedule,
    workload,
    alerts,
    fetchSchedulingData,
    clearData,
  };
};
