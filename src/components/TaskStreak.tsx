import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Trophy, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TaskStreakProps {
  currentStreak: number;
  longestStreak: number;
  todayCompleted: number;
  isStreakActive: boolean;
  variant?: 'compact' | 'full';
}

export const TaskStreak = ({
  currentStreak,
  longestStreak,
  todayCompleted,
  isStreakActive,
  variant = 'compact',
}: TaskStreakProps) => {
  const getFlameIntensity = () => {
    if (currentStreak >= 30) return 'legendary';
    if (currentStreak >= 14) return 'hot';
    if (currentStreak >= 7) return 'warm';
    if (currentStreak >= 3) return 'starting';
    return 'cold';
  };

  const intensity = getFlameIntensity();

  const flameColors = {
    legendary: 'from-violet-500 via-fuchsia-500 to-amber-500',
    hot: 'from-red-500 via-orange-500 to-yellow-400',
    warm: 'from-orange-500 via-amber-500 to-yellow-400',
    starting: 'from-amber-500 to-yellow-400',
    cold: 'from-slate-400 to-slate-500',
  };

  const glowColors = {
    legendary: 'shadow-violet-500/50',
    hot: 'shadow-orange-500/50',
    warm: 'shadow-amber-500/40',
    starting: 'shadow-yellow-500/30',
    cold: 'shadow-slate-500/20',
  };

  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                "relative flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer",
                "bg-gradient-to-r from-background/80 to-background/60 backdrop-blur-sm",
                "border border-border/50 hover:border-border transition-all",
                isStreakActive && currentStreak > 0 && `shadow-lg ${glowColors[intensity]}`
              )}
            >
              <div className="relative">
                <AnimatePresence>
                  {isStreakActive && currentStreak > 0 && (
                    <>
                      {/* Flame particles */}
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 0, scale: 0 }}
                          animate={{
                            opacity: [0, 0.8, 0],
                            y: [-5, -20],
                            scale: [0.5, 1, 0.3],
                            x: [0, (i - 1) * 8],
                          }}
                          transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            delay: i * 0.3,
                            ease: 'easeOut',
                          }}
                          className={cn(
                            "absolute -top-1 left-1/2 w-2 h-2 rounded-full",
                            `bg-gradient-to-t ${flameColors[intensity]}`
                          )}
                        />
                      ))}
                    </>
                  )}
                </AnimatePresence>
                
                <motion.div
                  animate={isStreakActive && currentStreak > 0 ? {
                    scale: [1, 1.1, 1],
                    rotate: [-3, 3, -3],
                  } : {}}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <Flame
                    className={cn(
                      "w-5 h-5",
                      isStreakActive && currentStreak > 0
                        ? `text-transparent bg-gradient-to-t ${flameColors[intensity]} bg-clip-text`
                        : "text-muted-foreground"
                    )}
                    style={{
                      fill: isStreakActive && currentStreak > 0 
                        ? intensity === 'legendary' ? '#a855f7' 
                        : intensity === 'hot' ? '#f97316' 
                        : intensity === 'warm' ? '#f59e0b' 
                        : '#eab308' 
                        : 'transparent',
                      stroke: isStreakActive && currentStreak > 0 
                        ? intensity === 'legendary' ? '#c084fc' 
                        : intensity === 'hot' ? '#fb923c' 
                        : intensity === 'warm' ? '#fbbf24' 
                        : '#facc15' 
                        : 'currentColor',
                    }}
                  />
                </motion.div>
              </div>
              
              <motion.span
                key={currentStreak}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={cn(
                  "font-bold text-sm tabular-nums",
                  isStreakActive && currentStreak > 0 ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {currentStreak}
              </motion.span>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="p-3">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                <span>Current Streak: <strong>{currentStreak} days</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>Best Streak: <strong>{longestStreak} days</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-500" />
                <span>Today: <strong>{todayCompleted} tasks</strong></span>
              </div>
              {!isStreakActive && currentStreak === 0 && (
                <p className="text-muted-foreground text-xs mt-2">
                  Complete a task to start your streak!
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Full variant for dashboard display
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-6",
        "bg-gradient-to-br from-card via-card/95 to-card/90",
        "border border-border/50",
        isStreakActive && currentStreak > 0 && `shadow-xl ${glowColors[intensity]}`
      )}
    >
      {/* Animated background */}
      {isStreakActive && currentStreak > 0 && (
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: '100%', opacity: 0 }}
              animate={{
                y: [100, -100],
                opacity: [0, 0.3, 0],
                x: [0, Math.sin(i) * 20],
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.4,
                ease: 'linear',
              }}
              className={cn(
                "absolute bottom-0 w-8 h-16 rounded-full blur-md",
                `bg-gradient-to-t ${flameColors[intensity]}`
              )}
              style={{ left: `${15 + i * 15}%` }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Task Streak</h3>
          <div className="relative">
            <motion.div
              animate={isStreakActive && currentStreak > 0 ? {
                scale: [1, 1.2, 1],
              } : {}}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Flame
                className="w-8 h-8"
                style={{
                  fill: isStreakActive && currentStreak > 0 
                    ? intensity === 'legendary' ? '#a855f7' 
                    : intensity === 'hot' ? '#f97316' 
                    : intensity === 'warm' ? '#f59e0b' 
                    : '#eab308' 
                    : '#64748b',
                  stroke: isStreakActive && currentStreak > 0 
                    ? intensity === 'legendary' ? '#c084fc' 
                    : intensity === 'hot' ? '#fb923c' 
                    : intensity === 'warm' ? '#fbbf24' 
                    : '#facc15' 
                    : '#94a3b8',
                }}
              />
            </motion.div>
          </div>
        </div>

        <div className="flex items-end gap-2 mb-4">
          <motion.span
            key={currentStreak}
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-5xl font-bold text-foreground tabular-nums"
          >
            {currentStreak}
          </motion.span>
          <span className="text-muted-foreground mb-2">days</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="text-muted-foreground">Best:</span>
            <span className="font-semibold">{longestStreak}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Zap className="w-4 h-4 text-emerald-500" />
            <span className="text-muted-foreground">Today:</span>
            <span className="font-semibold">{todayCompleted}</span>
          </div>
        </div>

        {currentStreak > 0 && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <p className="text-sm text-muted-foreground">
              {intensity === 'legendary' && "🔥 Legendary streak! You're unstoppable!"}
              {intensity === 'hot' && "🔥 You're on fire! Keep the momentum going!"}
              {intensity === 'warm' && "✨ Great progress! One week strong!"}
              {intensity === 'starting' && "💪 Nice start! Build that habit!"}
            </p>
          </div>
        )}

        {!isStreakActive && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <p className="text-sm text-muted-foreground">
              Complete a task today to start your streak!
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
