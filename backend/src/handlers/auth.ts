import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { success, badRequest, unauthorized, serverError } from '../utils/response';
import { logger } from '../utils/logger';

/**
 * Auth handler for development/demo mode.
 * In production, authentication is handled by Amazon Cognito
 * with API Gateway's built-in JWT authorizer.
 * This handler provides endpoints for the frontend to call
 * during development without requiring Cognito setup.
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
        return handleRegister(event.body);
      case path.endsWith('/profile') && method === 'GET':
        return handleGetProfile(event);
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

  const { email, password } = JSON.parse(body);

  if (!email || !password) {
    return badRequest('Email and password are required');
  }

  // Demo mode: accept demo credentials
  if (email === 'demo@focusflow.ai' && password === 'demo123') {
    return success({
      user: {
        id: 'user-demo-001',
        email: 'demo@focusflow.ai',
        name: 'Alex Developer',
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
        createdAt: '2024-01-01T00:00:00Z',
      },
      token: 'demo-token',
    });
  }

  // In production, Cognito handles this
  return unauthorized('Invalid credentials');
}

async function handleRegister(body: string | null): Promise<APIGatewayProxyResult> {
  if (!body) return badRequest('Request body is required');

  const { name, email, password } = JSON.parse(body);

  if (!name || !email || !password) {
    return badRequest('Name, email, and password are required');
  }

  if (password.length < 6) {
    return badRequest('Password must be at least 6 characters');
  }

  // In production, this calls Cognito signUp
  // For demo, create a mock user
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

async function handleGetProfile(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  // In production, extract from JWT claims
  return success({
    id: 'user-demo-001',
    email: 'demo@focusflow.ai',
    name: 'Alex Developer',
    createdAt: '2024-01-01T00:00:00Z',
  });
}

async function handleUpdateProfile(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (!event.body) return badRequest('Request body is required');
  const updates = JSON.parse(event.body);
  return success({ ...updates, updatedAt: new Date().toISOString() });
}
