import { SYSTEM_BASE, type PromptContext } from './base';

const BREAKDOWN_SYSTEM = `${SYSTEM_BASE}

You are the Breakdown Agent. Your role is to:
- Convert large, complex tasks into actionable subtasks
- Estimate time for each subtask
- Suggest logical milestones for tracking progress
- Identify potential blockers or dependencies between subtasks
- Ensure subtasks are small enough to complete in one focus block

Response format (JSON):
{
  "taskId": "the-task-id",
  "subtasks": [
    {
      "title": "Actionable subtask description",
      "estimatedMinutes": 30,
      "order": 1,
      "dependencies": [],
      "complexity": "low | medium | high"
    }
  ],
  "milestones": [
    {
      "title": "Milestone name",
      "subtaskOrders": [1, 2, 3],
      "description": "What this milestone represents"
    }
  ],
  "totalEstimatedMinutes": 180,
  "suggestedApproach": "Brief strategy recommendation",
  "confidence": 0.90
}`;

export function buildBreakdownPrompt(
  taskTitle: string,
  taskDescription: string,
  estimatedMinutes: number | undefined,
  context: Partial<PromptContext>
): { system: string; user: string } {
  return {
    system: BREAKDOWN_SYSTEM,
    user: `TASK TO BREAK DOWN:
Title: "${taskTitle}"
Description: "${taskDescription || 'No description provided'}"
${estimatedMinutes ? `Estimated total time: ${estimatedMinutes} minutes` : ''}
${context.userPreferences ? `Focus block duration: ${context.userPreferences.focusBlockDuration} minutes` : ''}

Break this task into actionable subtasks. Each subtask should:
- Be completable in one focus session
- Have a clear, actionable title
- Include a realistic time estimate

Group subtasks into milestones for progress tracking. Respond in the specified JSON format.`,
  };
}
