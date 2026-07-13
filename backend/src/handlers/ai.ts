import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { requireAuth } from '../utils/auth';
import { success, badRequest, serverError, unauthorized } from '../utils/response';
import { validateBody, AIsChatSchema, AIPrioritizeSchema, AIBreakdownSchema } from '../utils/validation';
import { getTasksByUser, getTaskById } from '../services/dynamodb';
import { runAgent, runPrioritization, runBreakdownAgent } from '../agents';
import type { PromptContext } from '../agents/prompts';
import { logger } from '../utils/logger';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const path = event.path.replace(/^\/api/, '');
  const method = event.httpMethod;

  logger.setContext(event.requestContext.requestId);

  try {
    const user = requireAuth(event);
    logger.setContext(event.requestContext.requestId, user.userId);

    if (method === 'OPTIONS') return success({});

    switch (true) {
      case path.endsWith('/chat') && method === 'POST':
        return handleChat(user.userId, event.body);
      case path.endsWith('/prioritize') && method === 'POST':
        return handlePrioritize(user.userId, event.body);
      case path.endsWith('/breakdown') && method === 'POST':
        return handleBreakdown(user.userId, event.body);
      case path.endsWith('/plan') && method === 'POST':
        return handlePlan(user.userId, event.body);
      case path.endsWith('/insights') && method === 'GET':
        return handleInsights(user.userId);
      default:
        return badRequest('Unknown AI endpoint');
    }
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return unauthorized();
    }
    logger.error('AI handler error', { error: (error as Error).message });
    return serverError('AI service temporarily unavailable');
  }
}

async function buildContext(userId: string): Promise<PromptContext> {
  const tasks = await getTasksByUser(userId);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const pendingTasks = tasks.filter((t: Record<string, unknown>) => t.status !== 'completed' && t.status !== 'cancelled');
  const completedToday = tasks.filter(
    (t: Record<string, unknown>) => t.completedAt && (t.completedAt as string) >= todayStart
  ).length;

  return {
    tasks: pendingTasks.map((t: Record<string, unknown>) => ({
      id: t.id as string,
      title: t.title as string,
      priority: t.priority as string,
      status: t.status as string,
      category: t.category as string,
      dueDate: t.dueDate as string | undefined,
      estimatedMinutes: t.estimatedMinutes as number | undefined,
      progress: (t.progress as number) || 0,
    })),
    userPreferences: {
      energyPattern: 'morning',
      workStartTime: '09:00',
      workEndTime: '17:00',
      breakDuration: 15,
      focusBlockDuration: 90,
    },
    currentTime: now.toISOString(),
    completedToday,
    totalPending: pendingTasks.length,
  };
}

async function handleChat(userId: string, body: string | null): Promise<APIGatewayProxyResult> {
  const data = validateBody(AIsChatSchema, body);
  logger.info('AI chat request', { agentType: data.agentType });

  const context = await buildContext(userId);
  const result = await runAgent(data.agentType, data.message, context);

  return success({
    message: result.message,
    data: result.data,
    confidence: result.confidence,
    agentType: result.agentType,
  });
}

async function handlePrioritize(userId: string, body: string | null): Promise<APIGatewayProxyResult> {
  const data = validateBody(AIPrioritizeSchema, body);
  logger.info('AI prioritize request', { taskCount: data.taskIds.length });

  const context = await buildContext(userId);
  // Filter context to only the requested tasks
  context.tasks = context.tasks.filter((t) => data.taskIds.includes(t.id));

  const result = await runPrioritization(context);
  return success(result.data);
}

async function handleBreakdown(userId: string, body: string | null): Promise<APIGatewayProxyResult> {
  const data = validateBody(AIBreakdownSchema, body);
  logger.info('AI breakdown request', { taskId: data.taskId });

  const task = await getTaskById(userId, data.taskId);
  if (!task) return badRequest('Task not found');

  const context = await buildContext(userId);
  const result = await runBreakdownAgent(
    {
      title: task.title as string,
      description: task.description as string | undefined,
      estimatedMinutes: task.estimatedMinutes as number | undefined,
    },
    context
  );

  return success(result.data);
}

async function handlePlan(userId: string, body: string | null): Promise<APIGatewayProxyResult> {
  logger.info('AI plan generation request');

  const context = await buildContext(userId);
  const result = await runAgent('planning', 'Generate an optimized daily plan for today', context);
  return success(result.data);
}

async function handleInsights(userId: string): Promise<APIGatewayProxyResult> {
  logger.info('AI insights request');

  const context = await buildContext(userId);
  const result = await runAgent('review', 'Provide insights about my productivity', context);

  // Return as array for frontend compatibility
  const insights = [
    {
      id: `insight-${Date.now()}`,
      type: 'daily_summary',
      title: 'AI Productivity Insight',
      content: result.message,
      confidence: result.confidence,
      createdAt: new Date().toISOString(),
    },
  ];

  return success(insights);
}
