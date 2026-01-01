import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export interface GamificationData {
  id: string;
  user_id: string;
  total_xp: number;
  level: number;
  tasks_completed: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
}

// XP rewards configuration
export const XP_REWARDS = {
  TASK_COMPLETE_LOW: 10,
  TASK_COMPLETE_MEDIUM: 20,
  TASK_COMPLETE_HIGH: 35,
  STREAK_BONUS_3: 15,
  STREAK_BONUS_7: 50,
  STREAK_BONUS_14: 100,
  STREAK_BONUS_30: 250,
  FIRST_TASK_OF_DAY: 5,
};

// Level thresholds
export const LEVEL_THRESHOLDS = [
  0,      // Level 1
  100,    // Level 2
  250,    // Level 3
  500,    // Level 4
  850,    // Level 5
  1300,   // Level 6
  1900,   // Level 7
  2700,   // Level 8
  3700,   // Level 9
  5000,   // Level 10
  6500,   // Level 11
  8500,   // Level 12
  11000,  // Level 13
  14000,  // Level 14
  18000,  // Level 15
  23000,  // Level 16
  29000,  // Level 17
  36000,  // Level 18
  45000,  // Level 19
  55000,  // Level 20
];

export const LEVEL_TITLES = [
  'Beginner',
  'Apprentice',
  'Task Tackler',
  'Progress Maker',
  'Goal Getter',
  'Sprint Star',
  'Project Pro',
  'Team Player',
  'Productivity Ninja',
  'Master Planner',
  'Elite Executor',
  'Champion',
  'Legendary',
  'Mythic',
  'Transcendent',
  'Cosmic',
  'Galactic',
  'Universal',
  'Omniscient',
  'The One',
];

export const calculateLevel = (xp: number): number => {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
};

export const getXPForNextLevel = (currentLevel: number): number => {
  if (currentLevel >= LEVEL_THRESHOLDS.length) {
    return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 10000;
  }
  return LEVEL_THRESHOLDS[currentLevel];
};

export const getXPProgress = (totalXp: number, level: number): { current: number; needed: number; percentage: number } => {
  const currentLevelXP = LEVEL_THRESHOLDS[level - 1] || 0;
  const nextLevelXP = getXPForNextLevel(level);
  const current = totalXp - currentLevelXP;
  const needed = nextLevelXP - currentLevelXP;
  const percentage = Math.min((current / needed) * 100, 100);
  
  return { current, needed, percentage };
};

export const useGamification = () => {
  const queryClient = useQueryClient();

  const { data: gamification, isLoading } = useQuery({
    queryKey: ['gamification'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_gamification')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      // Create record if doesn't exist
      if (!data) {
        const { data: newData, error: insertError } = await supabase
          .from('user_gamification')
          .insert({ user_id: user.id })
          .select()
          .single();
        
        if (insertError) throw insertError;
        return newData as GamificationData;
      }

      return data as GamificationData;
    },
  });

  const awardXP = useMutation({
    mutationFn: async ({ 
      xpAmount, 
      reason 
    }: { 
      xpAmount: number; 
      reason: 'task_complete' | 'streak_bonus' | 'milestone'; 
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get current data
      let currentData = gamification;
      
      if (!currentData) {
        const { data, error } = await supabase
          .from('user_gamification')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (error) throw error;
        currentData = data as GamificationData;
      }

      const today = new Date().toISOString().split('T')[0];
      const lastActivity = currentData?.last_activity_date;
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      let newStreak = currentData?.current_streak || 0;
      let bonusXP = 0;

      // Calculate streak
      if (reason === 'task_complete') {
        if (lastActivity === yesterday) {
          newStreak += 1;
        } else if (lastActivity !== today) {
          newStreak = 1;
        }

        // Streak bonuses
        if (newStreak === 3) bonusXP = XP_REWARDS.STREAK_BONUS_3;
        if (newStreak === 7) bonusXP = XP_REWARDS.STREAK_BONUS_7;
        if (newStreak === 14) bonusXP = XP_REWARDS.STREAK_BONUS_14;
        if (newStreak === 30) bonusXP = XP_REWARDS.STREAK_BONUS_30;

        // First task of day bonus
        if (lastActivity !== today) {
          bonusXP += XP_REWARDS.FIRST_TASK_OF_DAY;
        }
      }

      const totalXPEarned = xpAmount + bonusXP;
      const newTotalXP = (currentData?.total_xp || 0) + totalXPEarned;
      const newLevel = calculateLevel(newTotalXP);
      const newTasksCompleted = reason === 'task_complete' 
        ? (currentData?.tasks_completed || 0) + 1 
        : (currentData?.tasks_completed || 0);

      const { data, error } = await supabase
        .from('user_gamification')
        .upsert({
          user_id: user.id,
          total_xp: newTotalXP,
          level: newLevel,
          tasks_completed: newTasksCompleted,
          current_streak: newStreak,
          longest_streak: Math.max(newStreak, currentData?.longest_streak || 0),
          last_activity_date: today,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        data: data as GamificationData,
        xpEarned: totalXPEarned,
        leveledUp: newLevel > (currentData?.level || 1),
        newLevel,
        streakBonus: bonusXP,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
    },
  });

  return {
    gamification,
    isLoading,
    awardXP,
    calculateLevel,
    getXPProgress,
    LEVEL_TITLES,
  };
};
