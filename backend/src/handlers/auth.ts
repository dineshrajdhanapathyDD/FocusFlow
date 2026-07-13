import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { success, badRequest, serverError } from '../utils/response';
import { logger } from '../utils/logger';

/**
 * Auth handler - OTP-based email authentication.
 * In production, use Amazon Cognito with custom auth challenge (OTP via SES).
 * This handler accepts any email+code combination for development.
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const path = event.path.replace(/^\/api/, '');
  const method = event.httpMethod;

  logger.setContext(event.requestContext.requestId);

  try {
    if (method === 'OPTIONS') return success({});

    switch (true) {
      case path.endsWith('/login') && method === 'POST':
        return handleLogin(event.body);
      case path.endsWith('/register') && method === 'POST':
        return handleLogin(event.body); // Register = same as login with OTP
      case path.endsWith('/profile') && method === 'GET':
        return handleGetProfile();
      case path.endsWith('/profile') && method === 'PUT':
        return handleUpdateProfile(event);
      default:
        return badRequest('Unknown auth endpoint');
    }
  } catch (error) {
    logger.error('Auth handler error', { error: (error as Error).message });
    return serverError('Authentication service error');
  }
}

async function handleLogin(body: string | null): Promise<APIGatewayProxyResult> {
  if (!body) return badRequest('Request body is required');

  const { email } = JSON.parse(body);

  if (!email) {
    return badRequest('Email is required');
  }

  // Generate user from email (OTP already verified on frontend)
  const name = email
    .split('@')[0]
    .replace(/[._-]/g, ' ')
    .replace(/\b\w/g, (c: string) => c.toUpperCase());

  return success({
    user: {
      id: `user-${Date.now()}`,
      email,
      name,
      preferences: {
        theme: 'system',
        energyPattern: 'morning',
        workStartTime: '09:00',
        workEndTime: '17:00',
        breakDuration: 15,
        focusBlockDuration: 90,
        notifications: {
          deadlineReminder: true,
          dailyDigest: true,
          overdueAlert: true,
          productivityInsights: true,
        },
        categories: ['Work', 'Personal', 'Health', 'Learning'],
      },
      createdAt: new Date().toISOString(),
    },
    token: `token-${Date.now()}`,
  });
}

async function handleGetProfile(): Promise<APIGatewayProxyResult> {
  return success({
    id: 'user-001',
    email: 'user@focusflow.ai',
    name: 'User',
    createdAt: new Date().toISOString(),
  });
}

async function handleUpdateProfile(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (!event.body) return badRequest('Request body is required');
  const updates = JSON.parse(event.body);
  return success({ ...updates, updatedAt: new Date().toISOString() });
}
