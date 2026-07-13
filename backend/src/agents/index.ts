import { invokeAgent, parseJsonResponse } from '../services/bedrock';
import {
  buildProductivityCoachPrompt,
  buildPlanningPrompt,
  buildBreakdownPrompt,
  buildMotivationPrompt,
  buildReviewPrompt,
  buildPrioritizePrompt,
  type PromptContext,
} from './prompts';

export type AgentType = 'productivity_coach' | 'planning' | 'breakdown' | 'motivation' | 'review';

export interface AgentResult {
  message: string;
  data: Record<string, unknown>;
  confidence: number;
  agentType: AgentType;
}

export async function runProductivityCoach(
  userMessage: string,
  context: PromptContext
): Promise<AgentResult> {
  const prompt = buildProductivityCoachPrompt(userMessage, context);
  const response = await invokeAgent(prompt.system, prompt.user);
  const parsed = parseJsonResponse<Record<string, unknown>>(response);

  return {
    message: (parsed.message as string) || 'Here are my recommendations.',
    data: parsed,
    confidence: (parsed.confidence as number) || 0.8,
    agentType: 'productivity_coach',
  };
}

export async function runPlanningAgent(
  userMessage: string,
  context: PromptContext
): Promise<AgentResult> {
  const prompt = buildPlanningPrompt(userMessage, context);
  const response = await invokeAgent(prompt.system, prompt.user, 4096);
  const parsed = parseJsonResponse<Record<string, unknown>>(response);

  return {
    message: (parsed.reasoning as string) || 'Here is your optimized schedule.',
    data: parsed,
    confidence: (parsed.confidence as number) || 0.85,
    agentType: 'planning',
  };
}

export async function runBreakdownAgent(
  task: { title: string; description?: string; estimatedMinutes?: number },
  context: Partial<PromptContext>
): Promise<AgentResult> {
  const prompt = buildBreakdownPrompt(
    task.title,
    task.description || '',
    task.estimatedMinutes,
    context
  );
  const response = await invokeAgent(prompt.system, prompt.user, 4096);
  const parsed = parseJsonResponse<Record<string, unknown>>(response);

  return {
    message: (parsed.suggestedApproach as string) || 'Task broken down into subtasks.',
    data: parsed,
    confidence: (parsed.confidence as number) || 0.9,
    agentType: 'breakdown',
  };
}

export async function runMotivationAgent(
  userMessage: string,
  context: PromptContext
): Promise<AgentResult> {
  const prompt = buildMotivationPrompt(userMessage, context);
  const response = await invokeAgent(prompt.system, prompt.user);
  const parsed = parseJsonResponse<Record<string, unknown>>(response);

  return {
    message: (parsed.message as string) || 'Keep going, you are doing great!',
    data: parsed,
    confidence: (parsed.confidence as number) || 0.9,
    agentType: 'motivation',
  };
}

export async function runReviewAgent(
  userMessage: string,
  context: PromptContext
): Promise<AgentResult> {
  const prompt = buildReviewPrompt(userMessage, context);
  const response = await invokeAgent(prompt.system, prompt.user, 4096);
  const parsed = parseJsonResponse<Record<string, unknown>>(response);

  return {
    message: (parsed.message as string) || 'Here is your daily review.',
    data: parsed,
    confidence: (parsed.confidence as number) || 0.85,
    agentType: 'review',
  };
}

export async function runPrioritization(context: PromptContext): Promise<AgentResult> {
  const prompt = buildPrioritizePrompt(context);
  const response = await invokeAgent(prompt.system, prompt.user, 4096);
  const parsed = parseJsonResponse<Record<string, unknown>>(response);

  return {
    message: (parsed.summary as string) || 'Tasks have been prioritized.',
    data: parsed,
    confidence: 0.88,
    agentType: 'productivity_coach',
  };
}

export async function runAgent(
  agentType: AgentType,
  userMessage: string,
  context: PromptContext
): Promise<AgentResult> {
  switch (agentType) {
    case 'productivity_coach':
      return runProductivityCoach(userMessage, context);
    case 'planning':
      return runPlanningAgent(userMessage, context);
    case 'motivation':
      return runMotivationAgent(userMessage, context);
    case 'review':
      return runReviewAgent(userMessage, context);
    case 'breakdown':
      return runProductivityCoach(userMessage, context); // Fallback for chat mode
    default:
      return runProductivityCoach(userMessage, context);
  }
}
