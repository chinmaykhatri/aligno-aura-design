import { motion, AnimatePresence } from 'framer-motion';
import { Star, Trophy, Zap, TrendingUp, Flame, Award, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGamification, getXPProgress, LEVEL_TITLES, XP_REWARDS } from '@/hooks/useGamification';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';

interface XPDisplayProps {
  variant?: 'compact' | 'full' | 'mini';
  className?: string;
}

export const XPDisplay = ({ variant = 'compact', className }: XPDisplayProps) => {
  const { gamification, isLoading } = useGamification();

  if (isLoading || !gamification) {
    return (
      <div className={cn("animate-pulse bg-muted rounded-full h-8 w-24", className)} />
    );
  }

  const { current, needed, percentage } = getXPProgress(gamification.total_xp, gamification.level);
  const levelTitle = LEVEL_TITLES[Math.min(gamification.level - 1, LEVEL_TITLES.length - 1)];

  if (variant === 'mini') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-full",
                "bg-gradient-to-r from-amber-500/20 to-yellow-500/20",
                "border border-amber-500/30",
                className
              )}
            >
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-xs font-bold text-amber-400">Lv.{gamification.level}</span>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{levelTitle} • {gamification.total_xp} XP</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                "relative flex items-center gap-3 px-4 py-2 rounded-2xl cursor-pointer",
                "bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-orange-500/10",
                "border border-amber-500/30 hover:border-amber-500/50 transition-all",
                "shadow-lg shadow-amber-500/10",
                className
              )}
            >
              {/* Level badge */}
              <div className="relative">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                    <span className="text-sm font-bold text-white">{gamification.level}</span>
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 blur-md -z-10"
                  />
                </motion.div>
              </div>

              {/* XP info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-foreground truncate">{levelTitle}</span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {current}/{needed} XP
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 bg-background/50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 rounded-full"
                  />
                </div>
              </div>

              {/* Sparkle effects */}
              <AnimatePresence>
                {percentage > 80 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    className="absolute -top-1 -right-1"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="p-4 max-w-xs">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span className="font-semibold">Level {gamification.level} - {levelTitle}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-yellow-500" />
                  <span>{gamification.total_xp} Total XP</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{gamification.tasks_completed} Tasks</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  <span>{gamification.current_streak} Day Streak</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-purple-500" />
                  <span>Best: {gamification.longest_streak} Days</span>
                </div>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Full variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-6",
        "bg-gradient-to-br from-card via-card/95 to-card/90",
        "border border-amber-500/20",
        "shadow-xl shadow-amber-500/10",
        className
      )}
    >
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 5 + i,
              repeat: Infinity,
              delay: i * 0.5,
            }}
            className="absolute w-32 h-32 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-500/20 blur-3xl"
            style={{ left: `${i * 20}%`, top: `${(i % 3) * 30}%` }}
          />
        ))}
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              Experience Points
            </h3>
            <p className="text-sm text-muted-foreground mt-1">Keep completing tasks to level up!</p>
          </div>
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="relative"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-white">{gamification.level}</span>
            </div>
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 blur-xl -z-10"
            />
          </motion.div>
        </div>

        {/* Level title */}
        <div className="mb-4">
          <span className="text-2xl font-bold text-foreground">{levelTitle}</span>
        </div>

        {/* XP Progress */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress to Level {gamification.level + 1}</span>
            <span className="font-semibold text-amber-400">{current} / {needed} XP</span>
          </div>
          <div className="h-3 bg-background/50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 rounded-full relative"
            >
              <motion.div
                animate={{ x: ['0%', '100%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              />
            </motion.div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-xl bg-background/30 border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="text-xs text-muted-foreground">Total XP</span>
            </div>
            <span className="text-xl font-bold text-foreground">{gamification.total_xp.toLocaleString()}</span>
          </div>
          <div className="p-3 rounded-xl bg-background/30 border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Tasks Done</span>
            </div>
            <span className="text-xl font-bold text-foreground">{gamification.tasks_completed}</span>
          </div>
          <div className="p-3 rounded-xl bg-background/30 border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-xs text-muted-foreground">Current Streak</span>
            </div>
            <span className="text-xl font-bold text-foreground">{gamification.current_streak} days</span>
          </div>
          <div className="p-3 rounded-xl bg-background/30 border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-muted-foreground">Best Streak</span>
            </div>
            <span className="text-xl font-bold text-foreground">{gamification.longest_streak} days</span>
          </div>
        </div>

        {/* XP Rewards info */}
        <div className="mt-6 pt-4 border-t border-border/50">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">XP Rewards</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Low priority task</span>
              <span className="text-amber-400">+{XP_REWARDS.TASK_COMPLETE_LOW} XP</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Medium priority</span>
              <span className="text-amber-400">+{XP_REWARDS.TASK_COMPLETE_MEDIUM} XP</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">High priority</span>
              <span className="text-amber-400">+{XP_REWARDS.TASK_COMPLETE_HIGH} XP</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">7-day streak</span>
              <span className="text-amber-400">+{XP_REWARDS.STREAK_BONUS_7} XP</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
