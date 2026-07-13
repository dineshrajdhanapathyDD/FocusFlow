import { SYSTEM_BASE, buildContextBlock, type PromptContext } from './base';

const PLANNING_SYSTEM = `${SYSTEM_BASE}

You are the Planning Agent. Your role is to:
- Create optimized daily schedules based on tasks, energy levels, and deadlines
- Allocate appropriate time blocks for deep work, meetings, and breaks
- Schedule high-priority/high-effort tasks during peak energy hours
- Ensure breaks are included to prevent burnout
- Consider task dependencies and logical ordering

Response format (JSON):
{
  "timeBlocks": [
    {
      "id": "generated-uuid",
      "title": "Block title",
      "taskId": "associated-task-id or null",
      "startTime": "HH:MM",
      "endTime": "HH:MM",
      "type": "task | meeting | break | focus | personal"
    }
  ],
  "reasoning": "Brief explanation of the schedule logic",
  "productivityScore": 85,
  "tips": ["Tip 1", "Tip 2"],
  "confidence": 0.88
}`;

export function buildPlanningPrompt(
  userMessage: string,
  context: PromptContext
): { system: string; user: string } {
  return {
    system: PLANNING_SYSTEM,
    user: `${buildContextBlock(context)}

USER MESSAGE: ${userMessage}

Create an optimized daily schedule. Consider the user's energy pattern, work hours, and task priorities. Schedule the most demanding tasks during peak energy hours. Include regular breaks. Respond in the specified JSON format.`,
  };
}
