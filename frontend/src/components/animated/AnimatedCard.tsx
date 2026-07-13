import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
  glow?: boolean;
  glass?: boolean;
  onClick?: () => void;
}

export function AnimatedCard({
  children,
  className,
  delay = 0,
  hover = true,
  glow = false,
  glass = false,
  onClick,
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={hover ? { y: -2, scale: 1.01, boxShadow: '0 20px 40px rgba(0,0,0,0.08)' } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={cn(
        'rounded-2xl border p-5 transition-colors duration-200',
        glass
          ? 'bg-white/70 dark:bg-surface-800/70 backdrop-blur-xl border-white/20 dark:border-surface-700/50'
          : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700',
        glow && 'ring-1 ring-primary-500/20 shadow-[0_0_30px_rgba(59,130,246,0.1)]',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </motion.div>
  );
}
