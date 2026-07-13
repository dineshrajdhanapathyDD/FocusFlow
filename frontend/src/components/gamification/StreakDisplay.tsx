import { motion } from 'framer-motion';
import { useGamification } from './GamificationContext';
import { cn } from '@/lib/utils';

interface StreakDisplayProps {
  className?: string;
  variant?: 'compact' | 'full';
}

export function StreakDisplay({ className, variant = 'compact' }: StreakDisplayProps) {
  const { state } = useGamification();

  if (variant === 'compact') {
    return (
      <motion.div
        className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-900/20', className)}
        whileHover={{ scale: 1.05 }}
      >
        <motion.span
          className="text-sm"
          animate={state.streak >= 3 ? { scale: [1, 1.2, 1] } : undefined}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
        >
          🔥
        </motion.span>
        <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
          {state.streak}
        </span>
      </motion.div>
    );
  }

  // Full variant
  const days = Array.from({ length: 7 }, (_, i) => ({
    active: i < state.streak % 7 || state.streak >= 7,
    isToday: i === (state.streak % 7) - 1 || (state.streak % 7 === 0 && i === 6),
  }));

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <span className="text-lg">🔥</span>
        <span className="text-sm font-bold text-surface-900 dark:text-surface-100">
          {state.streak}-day streak
        </span>
        <span className="text-xs text-surface-500">(Best: {state.longestStreak})</span>
      </div>
      <div className="flex gap-1.5">
        {days.map((day, i) => (
          <motion.div
            key={i}
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium',
              day.active
                ? 'bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-sm'
                : 'bg-surface-100 dark:bg-surface-800 text-surface-400'
            )}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
