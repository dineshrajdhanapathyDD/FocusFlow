import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarDaysIcon,
  SparklesIcon,
  ClockIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { Button, Card, CardHeader, CardTitle, Badge } from '@/components/ui';
import type { TimeBlock, DailyPlan } from '@/types';
import { cn } from '@/lib/utils';

interface DailyPlannerProps {
  plan?: DailyPlan;
  onGeneratePlan: () => void;
  loading?: boolean;
}

const timeBlockColors: Record<string, string> = {
  task: 'bg-primary-100 dark:bg-primary-900/30 border-primary-300 dark:border-primary-700 text-primary-800 dark:text-primary-200',
  meeting: 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700 text-purple-800 dark:text-purple-200',
  break: 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-800 dark:text-green-200',
  focus: 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700 text-orange-800 dark:text-orange-200',
  personal: 'bg-pink-100 dark:bg-pink-900/30 border-pink-300 dark:border-pink-700 text-pink-800 dark:text-pink-200',
};

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM

export function DailyPlanner({ plan, onGeneratePlan, loading }: DailyPlannerProps) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const getBlocksForHour = (hour: number): TimeBlock[] => {
    if (!plan) return [];
    return plan.timeBlocks.filter((block) => {
      const blockHour = parseInt(block.startTime.split(':')[0]);
      return blockHour === hour;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-50">
            Daily Planner
          </h2>
          <p className="text-sm text-surface-500 mt-0.5">{today}</p>
        </div>
        <Button onClick={onGeneratePlan} loading={loading}>
          <SparklesIcon className="h-4 w-4" />
          AI Generate Plan
        </Button>
      </div>

      <Card padding="none">
        <div className="divide-y divide-surface-200 dark:divide-surface-700">
          {HOURS.map((hour) => {
            const blocks = getBlocksForHour(hour);
            const timeStr = `${hour % 12 || 12}:00 ${hour >= 12 ? 'PM' : 'AM'}`;

            return (
              <div key={hour} className="flex min-h-[60px]">
                <div className="w-20 flex-shrink-0 py-3 px-4 text-xs font-medium text-surface-400 dark:text-surface-500 border-r border-surface-200 dark:border-surface-700">
                  {timeStr}
                </div>
                <div className="flex-1 p-2 space-y-1">
                  {blocks.map((block) => (
                    <motion.div
                      key={block.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={cn(
                        'px-3 py-2 rounded-lg border text-xs font-medium',
                        timeBlockColors[block.type] || timeBlockColors.task
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span>{block.title}</span>
                        <span className="opacity-60">
                          {block.startTime} - {block.endTime}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                  {blocks.length === 0 && (
                    <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-xs text-surface-400 hover:text-primary-500 flex items-center gap-1">
                        <PlusIcon className="h-3 w-3" />
                        Add block
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {plan && (
        <div className="grid grid-cols-3 gap-3">
          <Card padding="sm" className="text-center">
            <p className="text-xs text-surface-500">Time Blocks</p>
            <p className="text-lg font-bold text-surface-900 dark:text-surface-50">
              {plan.timeBlocks.length}
            </p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-xs text-surface-500">Available Hours</p>
            <p className="text-lg font-bold text-surface-900 dark:text-surface-50">
              {plan.availableHours}h
            </p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-xs text-surface-500">Energy Peak</p>
            <p className="text-lg font-bold capitalize text-surface-900 dark:text-surface-50">
              {plan.energyPattern}
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
