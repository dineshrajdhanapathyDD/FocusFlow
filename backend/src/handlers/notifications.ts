import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { requireAuth } from '../utils/auth';
import { success, badRequest, serverError, unauthorized } from '../utils/response';
import { getNotificationsByUser, markNotificationRead } from '../services/dynamodb';
import { logger } from '../utils/logger';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const method = event.httpMethod;
  const path = event.path;

  logger.setContext(event.requestContext.requestId);

  try {
    const user = requireAuth(event);
    logger.setContext(event.requestContext.requestId, user.userId);

    if (method === 'OPTIONS') return success({});

    switch (true) {
      case method === 'GET':
        return handleList(user.userId);
      case path.endsWith('/read-all') && method === 'PUT':
        return handleMarkAllRead(user.userId);
      case path.includes('/read') && method === 'PUT':
        const id = event.pathParameters?.id;
        if (!id) return badRequest('Notification ID required');
        return handleMarkRead(user.userId, id);
      default:
        return badRequest('Unknown notifications endpoint');
    }
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return unauthorized();
    }
    logger.error('Notifications error', { error: (error as Error).message });
    return serverError('Failed to process notification request');
  }
}

async function handleList(userId: string): Promise<APIGatewayProxyResult> {
  const notifications = await getNotificationsByUser(userId);
  return success(notifications);
}

async function handleMarkRead(userId: string, id: string): Promise<APIGatewayProxyResult> {
  await markNotificationRead(userId, id);
  return success({ success: true });
}

async function handleMarkAllRead(userId: string): Promise<APIGatewayProxyResult> {
  const notifications = await getNotificationsByUser(userId);
  const unread = notifications.filter((n: Record<string, unknown>) => !n.read);
  await Promise.all(
    unread.map((n: Record<string, unknown>) => markNotificationRead(userId, n.id as string))
  );
  return success({ success: true });
}
