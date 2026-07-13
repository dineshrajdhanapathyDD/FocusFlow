import { SYSTEM_BASE, buildContextBlock, type PromptContext } from './base';

const PRIORITIZE_SYSTEM = `${SYSTEM_BASE}

You are the Task Prioritization Engine. Your role is to:
- Analyze tasks using the Eisenhower Matrix (urgent/important)
- Consider deadlines, dependencies, and effort
- Calculate a priority score for each task
- Recommend an optimal execution order
- Provide brief reasoning for each prioritization decision

Response format (JSON):
{
  "recommendations": [
    {
      "taskId": "task-id",
      "urgency": 8,
      "importance": 9,
      "estimatedEffort": 7,
      "recommendedOrder": 1,
      "reasoning": "Critical deadline tomorrow, high impact",
      "confidence": 0.92
    }
  ],
  "summary": "Brief overview of the prioritization logic",
  "timestamp": "ISO timestamp"
}

Scoring rules:
- urgency (1-10): Based on deadline proximity and consequences of delay
- importance (1-10): Based on impact, value, and alignment with goals
- estimatedEffort (1-10): Based on complexity and time required
- Tasks with close deadlines AND high importance should be top priority
- Tasks that block other tasks get a priority boost`;

export function buildPrioritizePrompt(
  context: PromptContext
): { system: string; user: string } {
  return {
    system: PRIORITIZE_SYSTEM,
    user: `${buildContextBlock(context)}

Analyze all pending tasks and provide a prioritized ordering. Consider deadlines, task importance, effort required, and the user's energy pattern. Respond in the specified JSON format.`,
  };
}
