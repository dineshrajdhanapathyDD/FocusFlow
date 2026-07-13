import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AIThinkingIndicatorProps {
  variant?: 'dots' | 'pulse' | 'brain';
  message?: string;
  className?: string;
}

export function AIThinkingIndicator({
  variant = 'dots',
  message = 'AI is thinking',
  className,
}: AIThinkingIndicatorProps) {
  if (variant === 'pulse') {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <motion.div
          className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-purple-500"
          animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div>
          <p className="text-sm font-medium text-surface-700 dark:text-surface-300">{message}</p>
          <p className="text-xs text-surface-400">Analyzing your data...</p>
        </div>
      </div>
    );
  }

  if (variant === 'brain') {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <motion.div
          className="relative w-10 h-10"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="text-2xl">🧠</span>
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary-500"
            animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </motion.div>
        <div>
          <p className="text-sm font-medium text-surface-700 dark:text-surface-300">{message}</p>
          <motion.div className="flex gap-1 mt-1">
            {['Reasoning', 'Planning', 'Executing'].map((step, i) => (
              <motion.span
                key={step}
                className="text-[10px] px-1.5 py-0.5 rounded bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.5 }}
              >
                {step}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </div>
    );
  }

  // Default: dots
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-primary-500"
            animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
          />
        ))}
      </div>
      <span className="text-xs text-surface-500">{message}</span>
    </div>
  );
}
