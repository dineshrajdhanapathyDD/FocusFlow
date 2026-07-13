import type { APIGatewayProxyResult } from 'aws-lambda';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Content-Type': 'application/json',
};

export function success(body: unknown, statusCode = 200): APIGatewayProxyResult {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body),
  };
}

export function created(body: unknown): APIGatewayProxyResult {
  return success(body, 201);
}

export function noContent(): APIGatewayProxyResult {
  return {
    statusCode: 204,
    headers: CORS_HEADERS,
    body: '',
  };
}

export function badRequest(message: string, details?: Record<string, string>): APIGatewayProxyResult {
  return {
    statusCode: 400,
    headers: CORS_HEADERS,
    body: JSON.stringify({ code: 'BAD_REQUEST', message, details }),
  };
}

export function unauthorized(message = 'Unauthorized'): APIGatewayProxyResult {
  return {
    statusCode: 401,
    headers: CORS_HEADERS,
    body: JSON.stringify({ code: 'UNAUTHORIZED', message }),
  };
}

export function notFound(message = 'Resource not found'): APIGatewayProxyResult {
  return {
    statusCode: 404,
    headers: CORS_HEADERS,
    body: JSON.stringify({ code: 'NOT_FOUND', message }),
  };
}

export function serverError(message = 'Internal server error'): APIGatewayProxyResult {
  return {
    statusCode: 500,
    headers: CORS_HEADERS,
    body: JSON.stringify({ code: 'INTERNAL_ERROR', message }),
  };
}
