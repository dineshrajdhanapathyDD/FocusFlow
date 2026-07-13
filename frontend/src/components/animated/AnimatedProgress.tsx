import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  showLabel?: boolean;
  className?: string;
  gradient?: boolean;
}

export function AnimatedProgress({
  value,
  max = 100,
  size = 'md',
  color,
  showLabel = false,
  className,
  gradient = false,
}: AnimatedProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = { sm: 'h-1.5', md: 'h-3', lg: 'h-5' };

  const barColor = gradient
    ? 'bg-gradient-to-r from-primary-400 via-primary-500 to-purple-500'
    : color || 'bg-primary-500';

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-medium text-surface-600 dark:text-surface-400">Progress</span>
          <motion.span
            className="text-xs font-bold text-surface-900 dark:text-surface-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            key={Math.round(percentage)}
          >
            {Math.round(percentage)}%
          </motion.span>
        </div>
      )}
      <div
        className={cn('w-full rounded-full bg-surface-100 dark:bg-surface-700/50 overflow-hidden', sizeClasses[size])}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <motion.div
          className={cn('h-full rounded-full', barColor)}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
      </div>
    </div>
  );
}

interface AnimatedRingProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  className?: string;
  children?: React.ReactNode;
}

export function AnimatedRing({
  value,
  max = 100,
  size = 100,
  strokeWidth = 8,
  color = '#3b82f6',
  className,
  children,
}: AnimatedRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-surface-100 dark:text-surface-700/50"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}
