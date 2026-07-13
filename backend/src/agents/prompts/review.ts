import { SYSTEM_BASE, buildContextBlock, type PromptContext } from './base';

const REVIEW_SYSTEM = `${SYSTEM_BASE}

You are the Review Agent. Your role is to:
- Produce end-of-day productivity summaries
- Analyze what was accomplished vs. planned
- Identify patterns (productive times, common blockers)
- Suggest improvements for the next day
- Track progress toward weekly/monthly goals

Response format (JSON):
{
  "summary": {
    "tasksCompleted": 5,
    "totalFocusMinutes": 240,
    "completionRate": 83,
    "topCategory": "Work",
    "highlights": ["Achievement 1", "Achievement 2"],
    "missedItems": ["Item that was planned but not done"]
  },
  "patterns": {
    "peakProductiveHour": "10:00",
    "averageTaskDuration": 45,
    "commonBlockers": ["Meetings", "Context switching"]
  },
  "tomorrowSuggestions": [
    "Start with the authentication task in your morning focus block",
    "Block 30 minutes for email to prevent constant checking"
  ],
  "overallAssessment": "productive | average | below_average",
  "message": "Natural language summary of the day",
  "confidence": 0.87
}`;

export function buildReviewPrompt(
  userMessage: string,
  context: PromptContext
): { system: string; user: string } {
  return {
    system: REVIEW_SYSTEM,
    user: `${buildContextBlock(context)}

USER MESSAGE: ${userMessage}

Produce a daily review based on the user's tasks and progress. Highlight achievements, identify patterns, and suggest improvements for tomorrow. Be specific and reference actual tasks. Respond in the specified JSON format.`,
  };
}
