import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Star, TrendingUp, Flame, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface XPGainAnimationProps {
  show: boolean;
  xpAmount: number;
  leveledUp?: boolean;
  newLevel?: number;
  streakBonus?: number;
  onComplete?: () => void;
}

export const XPGainAnimation = ({
  show,
  xpAmount,
  leveledUp = false,
  newLevel,
  streakBonus = 0,
  onComplete,
}: XPGainAnimationProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      
      if (leveledUp) {
        // Epic confetti for level up
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

        const interval = setInterval(() => {
          const timeLeft = animationEnd - Date.now();
          if (timeLeft <= 0) {
            clearInterval(interval);
            return;
          }

          const particleCount = 50 * (timeLeft / duration);
          confetti({
            ...defaults,
            particleCount,
            origin: { x: Math.random(), y: Math.random() - 0.2 },
            colors: ['#f59e0b', '#fbbf24', '#fcd34d', '#a855f7', '#c084fc'],
          });
        }, 250);
      } else {
        // Small celebration for XP gain
        confetti({
          particleCount: 30,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#fbbf24', '#fcd34d'],
          zIndex: 9999,
        });
      }

      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, leveledUp ? 4000 : 2500);

      return () => clearTimeout(timer);
    }
  }, [show, leveledUp, onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -30 }}
            transition={{ type: 'spring', damping: 15 }}
            className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-card/95 backdrop-blur-xl border border-amber-500/30 shadow-2xl shadow-amber-500/20"
          >
            {/* XP Icon */}
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0],
              }}
              transition={{ duration: 0.5, repeat: 2 }}
              className="relative"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                <Star className="w-10 h-10 text-white fill-white" />
              </div>
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 blur-xl -z-10"
              />
              
              {/* Floating particles */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0.5, 1, 0.5],
                    x: [0, (Math.random() - 0.5) * 80],
                    y: [0, -60 - Math.random() * 40],
                  }}
                  transition={{
                    duration: 1.5,
                    delay: i * 0.15,
                    repeat: Infinity,
                  }}
                  className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-amber-400"
                />
              ))}
            </motion.div>

            {/* XP Amount */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="text-center"
            >
              <motion.span
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.3, repeat: 3 }}
                className="text-4xl font-bold bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent"
              >
                +{xpAmount} XP
              </motion.span>
              
              {streakBonus > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center justify-center gap-1.5 mt-2 text-orange-400"
                >
                  <Flame className="w-4 h-4" />
                  <span className="text-sm font-medium">+{streakBonus} Streak Bonus!</span>
                </motion.div>
              )}
            </motion.div>

            {/* Level Up Message */}
            {leveledUp && newLevel && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
                className="flex flex-col items-center gap-2 mt-2"
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-purple-400" />
                  <span className="text-2xl font-bold text-purple-400">LEVEL UP!</span>
                  <Sparkles className="w-6 h-6 text-purple-400" />
                </div>
                <span className="text-lg text-foreground">You reached Level {newLevel}!</span>
              </motion.div>
            )}

            {/* Progress bar animation */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: leveledUp ? 3 : 2, ease: 'linear' }}
              className="h-1 bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 rounded-full"
              style={{ maxWidth: 200 }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
