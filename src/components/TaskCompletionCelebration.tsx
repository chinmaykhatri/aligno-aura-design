import { useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Trophy, Star, Sparkles } from 'lucide-react';

interface TaskCompletionCelebrationProps {
  show: boolean;
  taskTitle?: string;
  onComplete?: () => void;
  variant?: 'confetti' | 'milestone' | 'streak';
}

export const TaskCompletionCelebration = ({
  show,
  taskTitle,
  onComplete,
  variant = 'confetti',
}: TaskCompletionCelebrationProps) => {
  const fireConfetti = useCallback(() => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999,
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    // Main burst
    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      colors: ['#d4a574', '#e8c4a0', '#b8956a'],
    });

    fire(0.2, {
      spread: 60,
      colors: ['#22c55e', '#4ade80', '#86efac'],
    });

    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
      colors: ['#f59e0b', '#fbbf24', '#fcd34d'],
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
      colors: ['#8b5cf6', '#a78bfa', '#c4b5fd'],
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 45,
      colors: ['#ec4899', '#f472b6', '#f9a8d4'],
    });
  }, []);

  const fireMilestoneConfetti = useCallback(() => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#d4a574', '#22c55e', '#f59e0b', '#8b5cf6'],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#d4a574', '#22c55e', '#f59e0b', '#8b5cf6'],
      });
    }, 250);
  }, []);

  const fireStreakConfetti = useCallback(() => {
    const end = Date.now() + 1500;
    const colors = ['#d4a574', '#f59e0b', '#fbbf24'];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
        zIndex: 9999,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
        zIndex: 9999,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  useEffect(() => {
    if (show) {
      switch (variant) {
        case 'milestone':
          fireMilestoneConfetti();
          break;
        case 'streak':
          fireStreakConfetti();
          break;
        default:
          fireConfetti();
      }

      const timer = setTimeout(() => {
        onComplete?.();
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [show, variant, fireConfetti, fireMilestoneConfetti, fireStreakConfetti, onComplete]);

  const iconVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 260,
        damping: 20,
      },
    },
    exit: {
      scale: 0,
      opacity: 0,
      transition: { duration: 0.2 },
    },
  };

  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { delay: 0.2, duration: 0.4 },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.2 },
    },
  };

  const getIcon = () => {
    switch (variant) {
      case 'milestone':
        return <Trophy className="w-16 h-16 text-amber-400" />;
      case 'streak':
        return <Star className="w-16 h-16 text-amber-400" />;
      default:
        return <CheckCircle2 className="w-16 h-16 text-emerald-400" />;
    }
  };

  const getMessage = () => {
    switch (variant) {
      case 'milestone':
        return 'Milestone Achieved!';
      case 'streak':
        return 'On Fire! 🔥';
      default:
        return 'Task Complete!';
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-card/90 backdrop-blur-xl border border-border/50 shadow-2xl"
          >
            <motion.div
              variants={iconVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative"
            >
              {getIcon()}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Sparkles className="w-20 h-20 text-copper/30" />
              </motion.div>
            </motion.div>

            <motion.div
              variants={textVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="text-center"
            >
              <h3 className="text-2xl font-bold text-foreground">
                {getMessage()}
              </h3>
              {taskTitle && (
                <p className="text-muted-foreground mt-1 max-w-[200px] truncate">
                  {taskTitle}
                </p>
              )}
            </motion.div>

            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 2, ease: 'linear' }}
              className="h-1 bg-gradient-to-r from-copper via-emerald-400 to-copper rounded-full"
              style={{ maxWidth: 200 }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Hook for easy integration
export const useTaskCelebration = () => {
  const celebrate = useCallback((variant: 'confetti' | 'milestone' | 'streak' = 'confetti') => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999,
    };

    if (variant === 'confetti') {
      confetti({
        ...defaults,
        particleCount: count * 0.25,
        spread: 26,
        startVelocity: 55,
        colors: ['#d4a574', '#22c55e', '#f59e0b'],
      });
      confetti({
        ...defaults,
        particleCount: count * 0.35,
        spread: 100,
        colors: ['#8b5cf6', '#ec4899', '#22c55e'],
      });
    }
  }, []);

  return { celebrate };
};
