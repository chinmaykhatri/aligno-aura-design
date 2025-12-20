import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { parseISO, eachDayOfInterval, isWeekend, isWithinInterval } from 'date-fns';

export interface TeamTimeOff {
  id: string;
  project_id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  hours_per_day: number;
  reason: string | null;
  created_at: string;
  updated_at: string;
}

export const useTeamTimeOff = (projectId: string | undefined) => {
  return useQuery({
    queryKey: ['team-time-off', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('team_time_off')
        .select('*')
        .eq('project_id', projectId)
        .order('start_date', { ascending: true });

      if (error) throw error;
      return data as TeamTimeOff[];
    },
    enabled: !!projectId,
  });
};

export const useCreateTimeOff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (timeOff: {
      project_id: string;
      start_date: string;
      end_date: string;
      hours_per_day?: number;
      reason?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('team_time_off')
        .insert({
          ...timeOff,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['team-time-off', data.project_id] });
      toast.success('Time-off added');
    },
    onError: () => {
      toast.error('Failed to add time-off');
    },
  });
};

export const useDeleteTimeOff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase
        .from('team_time_off')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['team-time-off', data.projectId] });
      toast.success('Time-off removed');
    },
  });
};

// Calculate time-off hours for a user within a date range (sprint)
export const calculateTimeOffHours = (
  timeOffEntries: TeamTimeOff[],
  userId: string,
  sprintStart: Date,
  sprintEnd: Date
): number => {
  const userTimeOff = timeOffEntries.filter(t => t.user_id === userId);
  
  let totalHoursOff = 0;
  
  for (const entry of userTimeOff) {
    const entryStart = parseISO(entry.start_date);
    const entryEnd = parseISO(entry.end_date);
    
    // Get overlapping days between time-off and sprint
    const overlapStart = entryStart > sprintStart ? entryStart : sprintStart;
    const overlapEnd = entryEnd < sprintEnd ? entryEnd : sprintEnd;
    
    if (overlapStart <= overlapEnd) {
      const daysInRange = eachDayOfInterval({ start: overlapStart, end: overlapEnd });
      // Count only weekdays
      const workdays = daysInRange.filter(day => !isWeekend(day));
      totalHoursOff += workdays.length * entry.hours_per_day;
    }
  }
  
  return totalHoursOff;
};

// Check if a user has time-off during a specific date range
export const hasTimeOffDuring = (
  timeOffEntries: TeamTimeOff[],
  userId: string,
  startDate: Date,
  endDate: Date
): boolean => {
  return timeOffEntries.some(entry => {
    if (entry.user_id !== userId) return false;
    const entryStart = parseISO(entry.start_date);
    const entryEnd = parseISO(entry.end_date);
    
    return (
      isWithinInterval(entryStart, { start: startDate, end: endDate }) ||
      isWithinInterval(entryEnd, { start: startDate, end: endDate }) ||
      (entryStart <= startDate && entryEnd >= endDate)
    );
  });
};
