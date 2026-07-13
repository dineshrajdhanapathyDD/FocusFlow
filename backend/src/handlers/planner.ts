import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth } from '../utils/auth';
import { success, badRequest, notFound, serverError, unauthorized } from '../utils/response';
import { getDailyPlan, savePlan } from '../services/dynamodb';
import { logger } from '../utils/logger';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const method = event.httpMethod;
  const date = event.pathParameters?.date;

  logger.setContext(event.requestContext.requestId);

  try {
    const user = requireAuth(event);
    logger.setContext(event.requestContext.requestId, user.userId);

    if (method === 'OPTIONS') return success({});

    switch (method) {
      case 'GET':
        if (!date) return badRequest('Date parameter is required');
        return handleGetPlan(user.userId, date);
      case 'POST':
        return handleSavePlan(user.userId, event.body);
      case 'PUT':
        return handleUpdatePlan(user.userId, event.body);
      default:
        return badRequest(`Unsupported method: ${method}`);
    }
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return unauthorized();
    }
    logger.error('Planner handler error', { error: (error as Error).message });
    return serverError('Failed to process planner request');
  }
}

async function handleGetPlan(userId: string, date: string): Promise<APIGatewayProxyResult> {
  const plan = await getDailyPlan(userId, date);
  if (!plan) return notFound('No plan found for this date');
  return success(plan);
}

async function handleSavePlan(userId: string, body: string | null): Promise<APIGatewayProxyResult> {
  if (!body) return badRequest('Request body is required');

  const data = JSON.parse(body);
  const plan = {
    id: uuidv4(),
    userId,
    date: data.date || new Date().toISOString().split('T')[0],
    timeBlocks: data.timeBlocks || [],
    availableHours: data.availableHours || 8,
    energyPattern: data.energyPattern || 'morning',
    createdAt: new Date().toISOString(),
  };

  await savePlan(plan);
  logger.info('Plan saved', { planId: plan.id, date: plan.date });
  return success(plan);
}

async function handleUpdatePlan(userId: string, body: string | null): Promise<APIGatewayProxyResult> {
  if (!body) return badRequest('Request body is required');

  const data = JSON.parse(body);
  const plan = {
    ...data,
    userId,
    updatedAt: new Date().toISOString(),
  };

  await savePlan(plan);
  logger.info('Plan updated', { planId: plan.id });
  return success(plan);
}
