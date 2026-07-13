import { motion, AnimatePresence } from 'framer-motion';
import { useGamification } from './GamificationContext';

export function XPRewardPopup() {
  const { recentReward } = useGamification();

  return (
    <AnimatePresence>
      {recentReward && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[90] pointer-events-none"
        >
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-2xl shadow-orange-500/30">
            <motion.span
              className="text-2xl"
              animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5 }}
            >
              ⚡
            </motion.span>
            <div>
              <p className="text-sm font-bold">+{recentReward.xp} XP</p>
              <p className="text-xs opacity-90">{recentReward.reason}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
