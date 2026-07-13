import { motion } from 'framer-motion';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface SuggestedPromptsProps {
  prompts: string[];
  onSelect: (prompt: string) => void;
  className?: string;
}

export function SuggestedPrompts({ prompts, onSelect, className }: SuggestedPromptsProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-1.5">
        <SparklesIcon className="h-3.5 w-3.5 text-surface-400" />
        <span className="text-[11px] font-medium text-surface-400 uppercase tracking-wider">
          Suggestions
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {prompts.map((prompt, i) => (
          <motion.button
            key={prompt}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(prompt)}
            className="text-xs px-3 py-2 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 hover:border-primary-300 dark:hover:border-primary-600 hover:text-primary-700 dark:hover:text-primary-400 transition-colors shadow-sm"
          >
            {prompt}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
