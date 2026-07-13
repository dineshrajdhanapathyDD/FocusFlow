import { motion } from 'framer-motion';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { useGamification } from './GamificationContext';
import { AnimatedProgress } from '@/components/animated';
import { cn } from '@/lib/utils';

interface DailyChallengesProps {
  className?: string;
}

export function DailyChallenges({ className }: DailyChallengesProps) {
  const { state } = useGamification();
  const completedCount = state.dailyChallenges.filter((c) => c.completed).length;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100">
          Daily Challenges
        </h3>
        <span className="text-xs text-surface-500">
          {completedCount}/{state.dailyChallenges.length} done
        </span>
      </div>

      <div className="space-y-2">
        {state.dailyChallenges.map((challenge, i) => (
          <motion.div
            key={challenge.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              'flex items-center gap-3 p-3 rounded-xl border transition-all',
              challenge.completed
                ? 'bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800/30'
                : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700'
            )}
          >
            {challenge.completed ? (
              <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-surface-300 dark:border-surface-600 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className={cn(
                'text-xs font-medium',
                challenge.completed
                  ? 'text-green-700 dark:text-green-400 line-through'
                  : 'text-surface-900 dark:text-surface-100'
              )}>
                {challenge.title}
              </p>
              {!challenge.completed && (
                <AnimatedProgress
                  value={challenge.progress}
                  max={challenge.target}
                  size="sm"
                  className="mt-1.5"
                />
              )}
            </div>
            <span className={cn(
              'text-[10px] font-bold px-2 py-0.5 rounded-full',
              challenge.completed
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
            )}>
              +{challenge.xp} XP
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
