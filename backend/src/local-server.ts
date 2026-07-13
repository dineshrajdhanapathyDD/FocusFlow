/**
 * Local development server that simulates API Gateway + Lambda.
 * Run with: npx tsx watch src/local-server.ts
 */
import http from 'http';
import { handler as tasksHandler } from './handlers/tasks';
import { handler as authHandler } from './handlers/auth';
import { handler as aiHandler } from './handlers/ai';
import { handler as plannerHandler } from './handlers/planner';
import { handler as analyticsHandler } from './handlers/analytics';
import { handler as notificationsHandler } from './handlers/notifications';
import { handler as agentsHandler } from './handlers/agents';
import type { APIGatewayProxyEvent } from 'aws-lambda';

const PORT = 4000;

function buildEvent(req: http.IncomingMessage, body: string, pathname: string): APIGatewayProxyEvent {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  const pathParts = pathname.split('/').filter(Boolean);

  let pathParameters: Record<string, string> | null = null;
  if (pathParts.length >= 3) {
    pathParameters = { id: pathParts[2], date: pathParts[2] };
  }

  return {
    httpMethod: req.method || 'GET',
    path: pathname,
    pathParameters,
    queryStringParameters: Object.fromEntries(url.searchParams),
    headers: req.headers as Record<string, string>,
    body: body || null,
    isBase64Encoded: false,
    requestContext: {
      requestId: `local-${Date.now()}`,
      authorizer: null,
    },
    resource: '',
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
    stageVariables: null,
  } as unknown as APIGatewayProxyEvent;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    });
    res.end();
    return;
  }

  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', async () => {
    try {
      const event = buildEvent(req, body, pathname);
      let result;

      if (pathname.startsWith('/api/auth')) {
        result = await authHandler(event);
      } else if (pathname.startsWith('/api/tasks')) {
        result = await tasksHandler(event);
      } else if (pathname.startsWith('/api/agent')) {
        result = await agentsHandler(event);
      } else if (pathname.startsWith('/api/ai')) {
        result = await aiHandler(event);
      } else if (pathname.startsWith('/api/planner')) {
        result = await plannerHandler(event);
      } else if (pathname.startsWith('/api/analytics')) {
        result = await analyticsHandler(event);
      } else if (pathname.startsWith('/api/notifications')) {
        result = await notificationsHandler(event);
      } else {
        result = { statusCode: 404, headers: {}, body: JSON.stringify({ message: 'Not found' }) };
      }

      res.writeHead(result.statusCode, {
        ...result.headers,
        'Access-Control-Allow-Origin': '*',
      });
      res.end(result.body);
    } catch (error) {
      console.error('Server error:', error);
      res.writeHead(500);
      res.end(JSON.stringify({ message: 'Internal server error' }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`FocusFlow API server running at http://localhost:${PORT}`);
  console.log('Endpoints:');
  console.log('  POST /api/auth/login');
  console.log('  POST /api/auth/register');
  console.log('  GET  /api/tasks');
  console.log('  POST /api/tasks');
  console.log('  PUT  /api/tasks/:id');
  console.log('  DEL  /api/tasks/:id');
  console.log('  POST /api/ai/chat');
  console.log('  POST /api/ai/prioritize');
  console.log('  POST /api/ai/breakdown');
  console.log('  POST /api/ai/plan');
  console.log('  GET  /api/ai/insights');
  console.log('  GET  /api/planner/:date');
  console.log('  POST /api/planner');
  console.log('  GET  /api/analytics');
  console.log('  GET  /api/notifications');
  console.log('');
  console.log('  --- Strands Agents (proxy to :5000) ---');
  console.log('  POST /api/agent/chat');
  console.log('  POST /api/agent/coach');
  console.log('  POST /api/agent/plan');
  console.log('  POST /api/agent/breakdown');
  console.log('  POST /api/agent/review');
  console.log('  GET  /api/agent/tools');
});
