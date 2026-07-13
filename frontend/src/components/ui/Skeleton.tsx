import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-surface-200 dark:bg-surface-700', className)}
      aria-hidden="true"
    />
  );
}

export function TaskCardSkeleton() {
  return (
    <div className="p-4 rounded-2xl border border-surface-200 dark:border-surface-700 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <div className="flex items-center gap-2 pt-1">
        <Skeleton className="h-6 w-14 rounded-lg" />
        <Skeleton className="h-6 w-14 rounded-lg" />
        <Skeleton className="h-6 w-14 rounded-lg" />
      </div>
    </div>
  );
}

export function DashboardCardSkeleton() {
  return (
    <div className="p-5 rounded-2xl border border-surface-200 dark:border-surface-700 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="p-5 rounded-2xl border border-surface-200 dark:border-surface-700 space-y-4">
      <Skeleton className="h-5 w-32" />
      <div className="flex items-end gap-2 h-40">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="flex-1" style={{ height: `${30 + Math.random() * 70}%` }} />
        ))}
      </div>
    </div>
  );
}
