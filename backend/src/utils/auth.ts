import type { APIGatewayProxyEvent } from 'aws-lambda';

export interface AuthUser {
  userId: string;
  email: string;
  name: string;
}

/**
 * Extract user info from the Cognito authorizer claims
 * attached by API Gateway when the JWT is validated.
 */
export function extractUser(event: APIGatewayProxyEvent): AuthUser | null {
  try {
    // From Cognito JWT authorizer
    const claims = event.requestContext.authorizer?.claims;
    if (claims) {
      return {
        userId: claims.sub || claims['cognito:username'],
        email: claims.email,
        name: claims.name || claims['cognito:username'],
      };
    }

    // From custom authorizer (Lambda authorizer)
    const authContext = event.requestContext.authorizer;
    if (authContext?.userId) {
      return {
        userId: authContext.userId,
        email: authContext.email || '',
        name: authContext.name || '',
      };
    }

    // Development mode: extract from header
    const authHeader = event.headers?.Authorization || event.headers?.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      // In dev mode, we accept a simple user ID as token
      const token = authHeader.slice(7);
      if (token === 'demo-token') {
        return {
          userId: 'user-demo-001',
          email: 'demo@focusflow.ai',
          name: 'Alex Developer',
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

export function requireAuth(event: APIGatewayProxyEvent): AuthUser {
  const user = extractUser(event);
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}
