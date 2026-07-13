import { CalendarIcon } from '@heroicons/react/24/outline';
import { Card, CardHeader, CardTitle, Badge } from '@/components/ui';
import { formatDate, getRelativeTime } from '@/lib/utils';
import type { Task } from '@/types';

interface UpcomingDeadlinesProps {
  tasks: Task[];
}

export function UpcomingDeadlines({ tasks }: UpcomingDeadlinesProps) {
  const upcomingTasks = tasks
    .filter((t) => t.dueDate && t.status !== 'completed')
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Deadlines</CardTitle>
      </CardHeader>
      {upcomingTasks.length === 0 ? (
        <p className="text-sm text-surface-500 text-center py-4">No upcoming deadlines</p>
      ) : (
        <div className="space-y-3">
          {upcomingTasks.map((task) => {
            const isOverdue = new Date(task.dueDate!) < new Date();
            return (
              <div
                key={task.id}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors"
              >
                <CalendarIcon className={`h-5 w-5 flex-shrink-0 ${isOverdue ? 'text-red-500' : 'text-surface-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">
                    {task.title}
                  </p>
                  <p className="text-xs text-surface-500">
                    {formatDate(task.dueDate!)}
                  </p>
                </div>
                <Badge variant={isOverdue ? 'danger' : 'primary'}>
                  {getRelativeTime(task.dueDate!)}
                </Badge>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
