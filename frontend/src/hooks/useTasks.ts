import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '@/services/api';
import type { Task, TaskFormData, TaskStatus } from '@/types';
import toast from 'react-hot-toast';

const TASKS_KEY = ['tasks'];

export function useTasks() {
  return useQuery({
    queryKey: TASKS_KEY,
    queryFn: taskService.getAll,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TaskFormData) => taskService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
      toast.success('Task created successfully');
    },
    onError: () => {
      toast.error('Failed to create task');
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) => taskService.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: TASKS_KEY });
      const previousTasks = queryClient.getQueryData<Task[]>(TASKS_KEY);

      queryClient.setQueryData<Task[]>(TASKS_KEY, (old) =>
        old?.map((task) => (task.id === id ? { ...task, ...data } : task))
      );

      return { previousTasks };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(TASKS_KEY, context.previousTasks);
      }
      toast.error('Failed to update task');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => taskService.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: TASKS_KEY });
      const previousTasks = queryClient.getQueryData<Task[]>(TASKS_KEY);

      queryClient.setQueryData<Task[]>(TASKS_KEY, (old) =>
        old?.filter((task) => task.id !== id)
      );

      return { previousTasks };
    },
    onError: (_err, _id, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(TASKS_KEY, context.previousTasks);
      }
      toast.error('Failed to delete task');
    },
    onSuccess: () => {
      toast.success('Task deleted');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
    },
  });
}

export function useUpdateTaskStatus() {
  const updateTask = useUpdateTask();

  return {
    mutate: (taskId: string, status: TaskStatus) => {
      const data: Partial<Task> = { status };
      if (status === 'completed') {
        data.completedAt = new Date().toISOString();
        data.progress = 100;
      }
      updateTask.mutate({ id: taskId, data });
    },
  };
}
