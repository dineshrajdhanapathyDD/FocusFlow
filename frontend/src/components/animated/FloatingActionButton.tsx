import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface FABAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
}

interface FloatingActionButtonProps {
  actions: FABAction[];
  className?: string;
}

export function FloatingActionButton({ actions, className }: FloatingActionButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn('fixed bottom-6 right-6 z-40 flex flex-col-reverse items-end gap-3', className)}>
      {/* Actions */}
      <AnimatePresence>
        {open &&
          actions.map((action, i) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 20 }}
              transition={{ delay: i * 0.05, duration: 0.2 }}
              onClick={() => {
                action.onClick();
                setOpen(false);
              }}
              className="flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 shadow-lg hover:shadow-xl transition-shadow"
            >
              <span className={cn('w-8 h-8 rounded-full flex items-center justify-center', action.color || 'bg-primary-100 text-primary-600')}>
                {action.icon}
              </span>
              <span className="text-sm font-medium text-surface-700 dark:text-surface-200 whitespace-nowrap">
                {action.label}
              </span>
            </motion.button>
          ))}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 flex items-center justify-center"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{ rotate: open ? 45 : 0 }}
        transition={{ duration: 0.2 }}
      >
        {open ? <XMarkIcon className="h-6 w-6" /> : <PlusIcon className="h-6 w-6" />}
      </motion.button>
    </div>
  );
}
