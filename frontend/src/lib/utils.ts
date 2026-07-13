import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function getRelativeTime(date: string | Date): string {
  const now = new Date();
  const target = new Date(date);
  const diff = target.getTime() - now.getTime();
  const absDiff = Math.abs(diff);
  const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(absDiff / (1000 * 60 * 60));
  const minutes = Math.floor(absDiff / (1000 * 60));

  if (diff < 0) {
    if (days > 0) return `${days}d overdue`;
    if (hours > 0) return `${hours}h overdue`;
    return `${minutes}m overdue`;
  }

  if (days > 0) return `in ${days}d`;
  if (hours > 0) return `in ${hours}h`;
  return `in ${minutes}m`;
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    critical: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
    high: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20',
    medium: 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20',
    low: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
  };
  return colors[priority] || colors.medium;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    todo: 'text-surface-600 bg-surface-100 dark:text-surface-400 dark:bg-surface-800',
    in_progress: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20',
    completed: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
    cancelled: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
  };
  return colors[status] || colors.todo;
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function calculateProgress(subtasks: { completed: boolean }[]): number {
  if (subtasks.length === 0) return 0;
  const completed = subtasks.filter((s) => s.completed).length;
  return Math.round((completed / subtasks.length) * 100);
}
