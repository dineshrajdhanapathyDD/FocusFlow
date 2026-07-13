import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth } from '../utils/auth';
import { success, created, noContent, badRequest, notFound, serverError, unauthorized } from '../utils/response';
import { validateBody, TaskCreateSchema, TaskUpdateSchema } from '../utils/validation';
import { getTasksByUser, getTaskById, createTask, updateTask, deleteTask } from '../services/dynamodb';
import { logger } from '../utils/logger';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const method = event.httpMethod;
  const taskId = event.pathParameters?.id;

  logger.setContext(event.requestContext.requestId);

  try {
    const user = requireAuth(event);
    logger.setContext(event.requestContext.requestId, user.userId);

    switch (method) {
      case 'GET':
        return taskId ? handleGetTask(user.userId, taskId) : handleListTasks(user.userId);
      case 'POST':
        return handleCreateTask(user.userId, event.body);
      case 'PUT':
        if (!taskId) return badRequest('Task ID is required');
        return handleUpdateTask(user.userId, taskId, event.body);
      case 'DELETE':
        if (!taskId) return badRequest('Task ID is required');
        return handleDeleteTask(user.userId, taskId);
      case 'OPTIONS':
        return success({});
      default:
        return badRequest(`Unsupported method: ${method}`);
    }
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return unauthorized();
    }
    logger.error('Tasks handler error', { error: (error as Error).message });
    return serverError('Failed to process request');
  }
}

async function handleListTasks(userId: string): Promise<APIGatewayProxyResult> {
  logger.info('Listing tasks', { userId });
  const tasks = await getTasksByUser(userId);
  return success(tasks);
}

async function handleGetTask(userId: string, taskId: string): Promise<APIGatewayProxyResult> {
  const task = await getTaskById(userId, taskId);
  if (!task) return notFound('Task not found');
  return success(task);
}

async function handleCreateTask(userId: string, body: string | null): Promise<APIGatewayProxyResult> {
  try {
    const data = validateBody(TaskCreateSchema, body);
    const now = new Date().toISOString();

    const task = {
      id: uuidv4(),
      userId,
      ...data,
      status: 'todo',
      progress: 0,
      subtasks: [],
      order: Date.now(),
      createdAt: now,
      updatedAt: now,
    };

    await createTask(task);
    logger.info('Task created', { taskId: task.id });
    return created(task);
  } catch (error) {
    if ((error as Error).name === 'ZodError') {
      return badRequest('Validation failed', { details: (error as Error).message });
    }
    throw error;
  }
}

async function handleUpdateTask(userId: string, taskId: string, body: string | null): Promise<APIGatewayProxyResult> {
  try {
    const data = validateBody(TaskUpdateSchema, body);

    const existing = await getTaskById(userId, taskId);
    if (!existing) return notFound('Task not found');

    const updates: Record<string, unknown> = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    if (data.status === 'completed' && existing.status !== 'completed') {
      updates.completedAt = new Date().toISOString();
      updates.progress = 100;
    }

    const updated = await updateTask(userId, taskId, updates);
    logger.info('Task updated', { taskId });
    return success(updated);
  } catch (error) {
    if ((error as Error).name === 'ZodError') {
      return badRequest('Validation failed', { details: (error as Error).message });
    }
    throw error;
  }
}

async function handleDeleteTask(userId: string, taskId: string): Promise<APIGatewayProxyResult> {
  const existing = await getTaskById(userId, taskId);
  if (!existing) return notFound('Task not found');

  await deleteTask(userId, taskId);
  logger.info('Task deleted', { taskId });
  return noContent();
}
