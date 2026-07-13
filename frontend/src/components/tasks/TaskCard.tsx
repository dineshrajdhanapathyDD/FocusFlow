import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ClockIcon,
  CalendarIcon,
  EllipsisVerticalIcon,
  CheckCircleIcon,
  TrashIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import { Badge, ProgressBar } from '@/components/ui';
import { cn, formatDuration, getRelativeTime } from '@/lib/utils';
import type { Task } from '@/types';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onStatusChange?: (taskId: string, status: Task['status']) => void;
  isDragging?: boolean;
}

export function TaskCard({ task, onEdit, onDelete, onStatusChange, isDragging }: TaskCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const isCompleted = task.status === 'completed';
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !isCompleted;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        'group relative p-4 rounded-2xl border bg-white dark:bg-surface-800 transition-all duration-200',
        isDragging
          ? 'shadow-lg border-primary-300 dark:border-primary-600 scale-[1.02]'
          : 'border-surface-200 dark:border-surface-700 hover:shadow-md hover:border-surface-300 dark:hover:border-surface-600',
        isCompleted && 'opacity-70'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <button
          onClick={() => onStatusChange?.(task.id, isCompleted ? 'todo' : 'completed')}
          className="mt-0.5 flex-shrink-0 transition-transform hover:scale-110"
          aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
        >
          {isCompleted ? (
            <CheckCircleSolid className="h-5 w-5 text-green-500" />
          ) : (
            <CheckCircleIcon className="h-5 w-5 text-surface-300 dark:text-surface-600 hover:text-green-500" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <h4
            className={cn(
              'text-sm font-medium text-surface-900 dark:text-surface-100 truncate',
              isCompleted && 'line-through text-surface-500'
            )}
          >
            {task.title}
          </h4>
          {task.description && (
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-1 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex items-center flex-wrap gap-2 mt-3">
            <Badge
              variant={
                task.priority === 'critical'
                  ? 'danger'
                  : task.priority === 'high'
                  ? 'orange'
                  : task.priority === 'medium'
                  ? 'warning'
                  : 'success'
              }
            >
              {task.priority}
            </Badge>

            <Badge variant="outline">{task.category}</Badge>

            {task.estimatedMinutes && (
              <span className="flex items-center gap-1 text-xs text-surface-500">
                <ClockIcon className="h-3.5 w-3.5" />
                {formatDuration(task.estimatedMinutes)}
              </span>
            )}

            {task.dueDate && (
              <span
                className={cn(
                  'flex items-center gap-1 text-xs',
                  isOverdue ? 'text-red-500 font-medium' : 'text-surface-500'
                )}
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                {getRelativeTime(task.dueDate)}
              </span>
            )}
          </div>

          {task.tags.length > 0 && (
            <div className="flex items-center flex-wrap gap-1.5 mt-2">
              {task.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                >
                  {tag}
                </span>
              ))}
              {task.tags.length > 3 && (
                <span className="text-[10px] text-surface-400">+{task.tags.length - 3}</span>
              )}
            </div>
          )}

          {task.subtasks.length > 0 && (
            <div className="mt-3">
              <ProgressBar
                value={task.subtasks.filter((s) => s.completed).length}
                max={task.subtasks.length}
                size="sm"
                color="primary"
              />
              <span className="text-[10px] text-surface-500 mt-1">
                {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length} subtasks
              </span>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-all"
            aria-label="Task options"
          >
            <EllipsisVerticalIcon className="h-4 w-4 text-surface-400" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-8 z-10 w-36 py-1 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 shadow-lg">
              <button
                onClick={() => {
                  onEdit?.(task);
                  setShowMenu(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700"
              >
                <PencilIcon className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={() => {
                  onDelete?.(task.id);
                  setShowMenu(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10"
              >
                <TrashIcon className="h-4 w-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
