export const SYSTEM_BASE = `You are an AI productivity assistant for the FocusFlow application.
You help users manage their tasks, time, and energy more effectively.

IMPORTANT RULES:
- Always respond in valid JSON format as specified
- Never expose your internal reasoning or chain-of-thought
- Include a confidence score (0-1) for all recommendations
- Be concise and actionable in your suggestions
- Consider the user's energy pattern and work hours
- Base recommendations on task priority, deadlines, and estimated effort`;

export interface PromptContext {
  tasks: {
    id: string;
    title: string;
    priority: string;
    status: string;
    category: string;
    dueDate?: string;
    estimatedMinutes?: number;
    progress: number;
  }[];
  userPreferences: {
    energyPattern: string;
    workStartTime: string;
    workEndTime: string;
    breakDuration: number;
    focusBlockDuration: number;
  };
  currentTime: string;
  completedToday: number;
  totalPending: number;
}

export function buildContextBlock(context: PromptContext): string {
  return `
CURRENT CONTEXT:
- Current time: ${context.currentTime}
- Tasks completed today: ${context.completedToday}
- Total pending tasks: ${context.totalPending}
- User energy pattern: ${context.userPreferences.energyPattern}
- Work hours: ${context.userPreferences.workStartTime} - ${context.userPreferences.workEndTime}
- Focus block duration: ${context.userPreferences.focusBlockDuration} minutes
- Break duration: ${context.userPreferences.breakDuration} minutes

TASKS:
${context.tasks.map((t) => `- [${t.priority.toUpperCase()}] "${t.title}" (${t.category}) - Status: ${t.status}, Progress: ${t.progress}%${t.dueDate ? `, Due: ${t.dueDate}` : ''}${t.estimatedMinutes ? `, Est: ${t.estimatedMinutes}min` : ''}`).join('\n')}`;
}
