import { z } from 'zod';

export const TaskCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  category: z.string().min(1).max(50),
  tags: z.array(z.string().max(30)).max(5).default([]),
  dueDate: z.string().optional(),
  estimatedMinutes: z.number().min(1).max(480).optional(),
});

export const TaskUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  status: z.enum(['todo', 'in_progress', 'completed', 'cancelled']).optional(),
  category: z.string().min(1).max(50).optional(),
  tags: z.array(z.string().max(30)).max(5).optional(),
  dueDate: z.string().optional(),
  estimatedMinutes: z.number().min(1).max(480).optional(),
  progress: z.number().min(0).max(100).optional(),
  subtasks: z.array(z.object({
    id: z.string(),
    title: z.string(),
    completed: z.boolean(),
    estimatedMinutes: z.number().optional(),
  })).optional(),
});

export const AIsChatSchema = z.object({
  message: z.string().min(1).max(2000),
  agentType: z.enum(['productivity_coach', 'planning', 'breakdown', 'motivation', 'review']),
  context: z.record(z.unknown()).optional(),
});

export const AIPrioritizeSchema = z.object({
  taskIds: z.array(z.string()).min(1).max(50),
});

export const AIBreakdownSchema = z.object({
  taskId: z.string().min(1),
});

export function validateBody<T>(schema: z.ZodSchema<T>, body: string | null): T {
  if (!body) {
    throw new z.ZodError([{
      code: 'custom',
      path: [],
      message: 'Request body is required',
    }]);
  }

  const parsed = JSON.parse(body);
  return schema.parse(parsed);
}
