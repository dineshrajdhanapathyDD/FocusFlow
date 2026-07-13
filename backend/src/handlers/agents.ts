/**
 * Agents Handler
 *
 * Proxies requests to the Strands Agents FastAPI service.
 * In production, the Strands service runs as a separate container/Lambda.
 * This handler acts as the bridge between the API Gateway and the agent service.
 */
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { requireAuth } from '../utils/auth';
import { success, badRequest, serverError, unauthorized } from '../utils/response';
import { logger } from '../utils/logger';

const AGENTS_SERVICE_URL = process.env.AGENTS_SERVICE_URL || 'http://localhost:5000';

interface AgentRequest {
  message: string;
  agent_type?: string;
  task_id?: string;
  date?: string;
  context?: Record<string, unknown>;
}

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const path = event.path.replace(/^\/api/, '');
  const method = event.httpMethod;

  logger.setContext(event.requestContext.requestId);

  try {
    const user = requireAuth(event);
    logger.setContext(event.requestContext.requestId, user.userId);

    if (method === 'OPTIONS') return success({});

    switch (true) {
      case path.endsWith('/agent/chat') && method === 'POST':
        return handleAgentChat(event.body);
      case path.endsWith('/agent/coach') && method === 'POST':
        return handleAgentCoach(event.body);
      case path.endsWith('/agent/plan') && method === 'POST':
        return handleAgentPlan(event.body);
      case path.endsWith('/agent/breakdown') && method === 'POST':
        return handleAgentBreakdown(event.body);
      case path.endsWith('/agent/review') && method === 'POST':
        return handleAgentReview();
      case path.endsWith('/agent/aws/digest') && method === 'POST':
        return handleAWSDigest(event.body);
      case path.endsWith('/agent/aws/learn') && method === 'POST':
        return handleAWSLearn(event.body);
      case path.endsWith('/agent/aws/events') && method === 'POST':
        return handleAWSEvents();
      case path.endsWith('/agent/aws/skill-plan') && method === 'POST':
        return handleAWSSkillPlan(event.body);
      case path.endsWith('/agent/tools') && method === 'GET':
        return handleListTools();
      default:
        return badRequest('Unknown agent endpoint');
    }
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return unauthorized();
    }
    logger.error('Agents handler error', { error: (error as Error).message });
    return serverError('Agent service temporarily unavailable');
  }
}

async function proxyToAgents(endpoint: string, body?: unknown): Promise<APIGatewayProxyResult> {
  try {
    const url = `${AGENTS_SERVICE_URL}${endpoint}`;
    logger.info('Proxying to agents service', { url });

    const response = await fetch(url, {
      method: body ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(55000), // 55s timeout (Lambda max is 60s)
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('Agents service error', { status: response.status, error });
      return serverError(`Agent returned error: ${response.status}`);
    }

    const data = await response.json();
    return success(data);
  } catch (error) {
    // If agent service is not running, return a helpful mock response
    if ((error as Error).message?.includes('ECONNREFUSED') || (error as Error).name === 'TypeError') {
      logger.warn('Agents service not reachable, returning fallback');
      return success({
        response: 'The agentic AI service is not currently running. Start it with: cd agents && python -m src.server',
        agent_type: 'system',
        tool_calls: [],
        success: false,
        fallback: true,
      });
    }
    throw error;
  }
}

async function handleAgentChat(body: string | null): Promise<APIGatewayProxyResult> {
  if (!body) return badRequest('Request body is required');
  const data = JSON.parse(body) as AgentRequest;
  if (!data.message) return badRequest('message is required');

  return proxyToAgents('/agent/chat', {
    message: data.message,
    agent_type: data.agent_type || 'orchestrator',
  });
}

async function handleAgentCoach(body: string | null): Promise<APIGatewayProxyResult> {
  if (!body) return badRequest('Request body is required');
  const data = JSON.parse(body) as AgentRequest;

  return proxyToAgents('/agent/coach', {
    message: data.message || 'Give me productivity coaching based on my current tasks',
  });
}

async function handleAgentPlan(body: string | null): Promise<APIGatewayProxyResult> {
  const data: AgentRequest = body ? JSON.parse(body) : {};

  return proxyToAgents('/agent/plan', {
    date: data.date,
    message: data.message,
  });
}

async function handleAgentBreakdown(body: string | null): Promise<APIGatewayProxyResult> {
  if (!body) return badRequest('Request body is required');
  const data = JSON.parse(body) as AgentRequest;
  if (!data.task_id) return badRequest('task_id is required');

  return proxyToAgents('/agent/breakdown', {
    task_id: data.task_id,
    message: data.message,
  });
}

async function handleAgentReview(): Promise<APIGatewayProxyResult> {
  return proxyToAgents('/agent/review', {});
}

async function handleListTools(): Promise<APIGatewayProxyResult> {
  return proxyToAgents('/tools');
}


// ===== AWS Learning Agent Handlers =====

async function handleAWSDigest(body: string | null): Promise<APIGatewayProxyResult> {
  const data = body ? JSON.parse(body) : {};
  return proxyToAgents('/agent/aws/digest', {
    interests: data.interests,
  });
}

async function handleAWSLearn(body: string | null): Promise<APIGatewayProxyResult> {
  if (!body) return badRequest('Request body is required');
  const data = JSON.parse(body) as { message: string; topic?: string };
  if (!data.message) return badRequest('message is required');

  return proxyToAgents('/agent/aws/learn', {
    message: data.message,
    topic: data.topic,
  });
}

async function handleAWSEvents(): Promise<APIGatewayProxyResult> {
  return proxyToAgents('/agent/aws/events', {});
}

async function handleAWSSkillPlan(body: string | null): Promise<APIGatewayProxyResult> {
  if (!body) return badRequest('Request body is required');
  const data = JSON.parse(body) as { message: string };
  if (!data.message) return badRequest('message is required');

  return proxyToAgents('/agent/aws/skill-plan', { message: data.message });
}
