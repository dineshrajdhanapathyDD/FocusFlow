import { useState, useCallback } from 'react';
import { TaskList, TaskForm } from '@/components/tasks';
import { useKeyboardShortcuts } from '@/hooks';
import { mockTasks } from '@/services/mockData';
import type { Task, TaskFormData, TaskStatus } from '@/types';
import { generateId } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();

  const openForm = useCallback(() => setShowForm(true), []);
  useKeyboardShortcuts(openForm);

  const handleCreateTask = (data: TaskFormData) => {
    const newTask: Task = {
      id: generateId(),
      userId: 'user-1',
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: 'todo',
      category: data.category,
      tags: data.tags,
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
      estimatedMinutes: data.estimatedMinutes,
      progress: 0,
      subtasks: [],
      order: tasks.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleUpdateTask = (data: TaskFormData) => {
    if (!editingTask) return;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === editingTask.id
          ? { ...t, ...data, updatedAt: new Date().toISOString() }
          : t
      )
    );
    setEditingTask(undefined);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    toast.success('Task deleted');
  };

  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status,
              progress: status === 'completed' ? 100 : t.progress,
              completedAt: status === 'completed' ? new Date().toISOString() : undefined,
              updatedAt: new Date().toISOString(),
            }
          : t
      )
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Tasks</h1>
        <p className="text-sm text-surface-500 mt-1">
          Manage and organize all your tasks. Press <kbd className="px-1.5 py-0.5 rounded bg-surface-100 dark:bg-surface-800 text-xs font-mono">N</kbd> to create a new task.
        </p>
      </div>

      <TaskList
        tasks={tasks}
        onCreateTask={openForm}
        onEditTask={handleEditTask}
        onDeleteTask={handleDeleteTask}
        onStatusChange={handleStatusChange}
      />

      <TaskForm
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingTask(undefined);
        }}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
        initialData={editingTask}
      />
    </div>
  );
}
