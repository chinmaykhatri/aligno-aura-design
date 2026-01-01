import { useMemo } from 'react';
import { Task } from '@/hooks/useTasks';
import { startOfDay, subDays, isSameDay, differenceInDays } from 'date-fns';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  todayCompleted: number;
  isStreakActive: boolean;
  streakDates: Date[];
}

export const useTaskStreak = (tasks: Task[] | undefined): StreakData => {
  return useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        todayCompleted: 0,
        isStreakActive: false,
        streakDates: [],
      };
    }

    // Get completed tasks sorted by completion date
    const completedTasks = tasks
      .filter(t => t.status === 'completed' && t.updated_at)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

    if (completedTasks.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        todayCompleted: 0,
        isStreakActive: false,
        streakDates: [],
      };
    }

    // Group completions by day
    const completionsByDay = new Map<string, number>();
    completedTasks.forEach(task => {
      const dayKey = startOfDay(new Date(task.updated_at)).toISOString();
      completionsByDay.set(dayKey, (completionsByDay.get(dayKey) || 0) + 1);
    });

    const today = startOfDay(new Date());
    const yesterday = startOfDay(subDays(new Date(), 1));
    
    // Count today's completions
    const todayCompleted = completionsByDay.get(today.toISOString()) || 0;

    // Calculate current streak
    let currentStreak = 0;
    const streakDates: Date[] = [];
    let checkDate = today;
    
    // Check if streak is active (completed task today or yesterday)
    const hasToday = completionsByDay.has(today.toISOString());
    const hasYesterday = completionsByDay.has(yesterday.toISOString());
    const isStreakActive = hasToday || hasYesterday;

    if (isStreakActive) {
      // Start from today if has completion, otherwise from yesterday
      checkDate = hasToday ? today : yesterday;
      
      while (completionsByDay.has(checkDate.toISOString())) {
        currentStreak++;
        streakDates.push(new Date(checkDate));
        checkDate = subDays(checkDate, 1);
      }
    }

    // Calculate longest streak
    const sortedDays = Array.from(completionsByDay.keys())
      .map(d => new Date(d))
      .sort((a, b) => a.getTime() - b.getTime());

    let longestStreak = 0;
    let tempStreak = 1;

    for (let i = 1; i < sortedDays.length; i++) {
      const diff = differenceInDays(sortedDays[i], sortedDays[i - 1]);
      if (diff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

    return {
      currentStreak,
      longestStreak,
      todayCompleted,
      isStreakActive,
      streakDates,
    };
  }, [tasks]);
};
