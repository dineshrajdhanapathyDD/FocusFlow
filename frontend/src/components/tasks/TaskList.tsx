import { useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { PlusIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { Button, Input, Select, EmptyState, Badge } from '@/components/ui';
import { TaskCard } from './TaskCard';
import { TaskCardSkeleton } from '@/components/ui/Skeleton';
import { PRIORITIES, STATUSES } from '@/lib/constants';
import type { Task, Priority, TaskStatus } from '@/types';

interface TaskListProps {
  tasks: Task[];
  loading?: boolean;
  onCreateTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
}

export function TaskList({
  tasks,
  loading,
  onCreateTask,
  onEditTask,
  onDeleteTask,
  onStatusChange,
}: TaskListProps) {
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | ''>('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');
  const [showFilters, setShowFilters] = useState(false);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        !search ||
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        task.description?.toLowerCase().includes(search.toLowerCase()) ||
        task.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));

      const matchesPriority = !priorityFilter || task.priority === priorityFilter;
      const matchesStatus = !statusFilter || task.status === statusFilter;

      return matchesSearch && matchesPriority && matchesStatus;
    });
  }, [tasks, search, priorityFilter, statusFilter]);

  const activeFilters = [priorityFilter, statusFilter].filter(Boolean).length;

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <TaskCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<MagnifyingGlassIcon className="h-4 w-4" />}
          />
        </div>
        <Button
          variant={showFilters ? 'primary' : 'secondary'}
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
          aria-label="Toggle filters"
        >
          <FunnelIcon className="h-4 w-4" />
          {activeFilters > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary-500 text-[10px] text-white flex items-center justify-center">
              {activeFilters}
            </span>
          )}
        </Button>
        <Button onClick={onCreateTask}>
          <PlusIcon className="h-4 w-4" />
          New Task
        </Button>
      </div>

      {showFilters && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700">
          <Select
            options={[{ value: '', label: 'All Priorities' }, ...PRIORITIES.map((p) => ({ value: p.value, label: p.label }))]}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as Priority | '')}
          />
          <Select
            options={[{ value: '', label: 'All Statuses' }, ...STATUSES.map((s) => ({ value: s.value, label: s.label }))]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TaskStatus | '')}
          />
          {activeFilters > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setPriorityFilter('');
                setStatusFilter('');
              }}
            >
              Clear
            </Button>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="text-sm text-surface-500">
          {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
        </span>
        {search && (
          <Badge variant="primary">Searching: {search}</Badge>
        )}
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onStatusChange={onStatusChange}
            />
          ))}
        </AnimatePresence>
      </div>

      {filteredTasks.length === 0 && tasks.length > 0 && (
        <EmptyState
          title="No matching tasks"
          description="Try adjusting your search or filters"
          action={
            <Button variant="secondary" onClick={() => { setSearch(''); setPriorityFilter(''); setStatusFilter(''); }}>
              Clear Filters
            </Button>
          }
        />
      )}

      {tasks.length === 0 && (
        <EmptyState
          title="No tasks yet"
          description="Create your first task to get started with AI-powered productivity"
          action={
            <Button onClick={onCreateTask}>
              <PlusIcon className="h-4 w-4" />
              Create Task
            </Button>
          }
        />
      )}
    </div>
  );
}
