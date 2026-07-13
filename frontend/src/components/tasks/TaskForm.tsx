import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Button, Input, Textarea, Select, Dialog, DialogHeader, DialogFooter } from '@/components/ui';
import { PRIORITIES, DEFAULT_CATEGORIES } from '@/lib/constants';
import type { Task, TaskFormData } from '@/types';
import { useState } from 'react';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  description: z.string().max(1000).optional(),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  category: z.string().min(1, 'Category is required'),
  dueDate: z.string().optional(),
  estimatedMinutes: z.number().min(1).max(480).optional(),
});

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => void;
  initialData?: Partial<Task>;
  loading?: boolean;
}

export function TaskForm({ open, onClose, onSubmit, initialData, loading }: TaskFormProps) {
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      priority: initialData?.priority || 'medium',
      category: initialData?.category || 'Work',
      dueDate: initialData?.dueDate?.split('T')[0] || '',
      estimatedMinutes: initialData?.estimatedMinutes || undefined,
    },
  });

  const handleFormSubmit = (data: TaskFormData) => {
    onSubmit({ ...data, tags });
    reset();
    setTags([]);
    onClose();
  };

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed) && tags.length < 5) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader
        title={initialData ? 'Edit Task' : 'Create Task'}
        description="Fill in the details to organize your work"
        onClose={onClose}
      />

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <Input
          label="Title"
          placeholder="What needs to be done?"
          error={errors.title?.message}
          {...register('title')}
        />

        <Textarea
          label="Description"
          placeholder="Add more details..."
          error={errors.description?.message}
          {...register('description')}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Priority"
            options={PRIORITIES.map((p) => ({ value: p.value, label: p.label }))}
            error={errors.priority?.message}
            {...register('priority')}
          />

          <Select
            label="Category"
            options={DEFAULT_CATEGORIES.map((c) => ({ value: c, label: c }))}
            error={errors.category?.message}
            {...register('category')}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Due Date"
            type="date"
            error={errors.dueDate?.message}
            {...register('dueDate')}
          />

          <Input
            label="Estimated (minutes)"
            type="number"
            placeholder="30"
            error={errors.estimatedMinutes?.message}
            {...register('estimatedMinutes', { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
            Tags
          </label>
          <div className="flex items-center gap-2">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="Add a tag..."
              className="input-field flex-1"
            />
            <Button type="button" variant="secondary" size="icon-sm" onClick={addTag}>
              <PlusIcon className="h-4 w-4" />
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400"
                >
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove tag ${tag}`}>
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {initialData ? 'Update Task' : 'Create Task'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
