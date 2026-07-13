import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  color?: 'primary' | 'green' | 'orange' | 'purple' | 'pink';
  index?: number;
}

const colorMap = {
  primary: 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400',
  green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
  orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
  purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  pink: 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400',
};

export function StatsCard({ title, value, subtitle, icon, trend, color = 'primary', index = 0 }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card hover className="relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-surface-500 dark:text-surface-400">{title}</p>
            <p className="text-2xl font-bold text-surface-900 dark:text-surface-50 mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5">{subtitle}</p>
            )}
            {trend && (
              <p
                className={cn(
                  'text-xs font-medium mt-2',
                  trend.value >= 0 ? 'text-green-600' : 'text-red-600'
                )}
              >
                {trend.value >= 0 ? '+' : ''}
                {trend.value}% {trend.label}
              </p>
            )}
          </div>
          <div className={cn('p-3 rounded-xl', colorMap[color])}>
            {icon}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
