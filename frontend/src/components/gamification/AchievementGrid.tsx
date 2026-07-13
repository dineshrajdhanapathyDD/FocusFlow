import { motion } from 'framer-motion';
import { useGamification } from './GamificationContext';
import { cn } from '@/lib/utils';

interface AchievementGridProps {
  className?: string;
  limit?: number;
}

export function AchievementGrid({ className, limit }: AchievementGridProps) {
  const { state } = useGamification();
  const achievements = limit ? state.achievements.slice(0, limit) : state.achievements;
  const unlocked = achievements.filter((a) => a.unlockedAt);
  const locked = achievements.filter((a) => !a.unlockedAt);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Unlocked */}
      {unlocked.length > 0 && (
        <div>
          <p className="text-xs font-medium text-surface-500 mb-2 uppercase tracking-wider">Unlocked</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {unlocked.map((achievement, i) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 border border-yellow-200/50 dark:border-yellow-800/30"
              >
                <motion.span
                  className="text-2xl"
                  whileHover={{ scale: 1.3, rotate: 10 }}
                >
                  {achievement.icon}
                </motion.span>
                <span className="text-[10px] font-medium text-surface-700 dark:text-surface-300 text-center leading-tight">
                  {achievement.title}
                </span>
                <span className="text-[9px] text-yellow-600 dark:text-yellow-400 font-bold">
                  +{achievement.xp} XP
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <div>
          <p className="text-xs font-medium text-surface-500 mb-2 uppercase tracking-wider">In Progress</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {locked.map((achievement, i) => {
              const progress = Math.min((achievement.progress / achievement.requirement) * 100, 100);
              return (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 + 0.2 }}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700 relative overflow-hidden"
                >
                  {/* Progress fill */}
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-primary-500/10 dark:bg-primary-500/5 transition-all duration-500"
                    style={{ height: `${progress}%` }}
                  />
                  <span className="text-2xl relative z-10 opacity-50 grayscale">
                    {achievement.icon}
                  </span>
                  <span className="text-[10px] font-medium text-surface-500 text-center leading-tight relative z-10">
                    {achievement.title}
                  </span>
                  <span className="text-[9px] text-surface-400 relative z-10">
                    {achievement.progress}/{achievement.requirement}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
