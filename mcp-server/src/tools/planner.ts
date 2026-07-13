import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { store } from '../store.js';

export function registerPlannerTools(server: McpServer) {
  // Get today's plan
  server.tool(
    'get_daily_plan',
    'Get the schedule/plan for a specific date. Returns time blocks allocated for the day.',
    {
      date: z.string().optional().describe('Date in YYYY-MM-DD format. Defaults to today.'),
    },
    async ({ date }) => {
      const targetDate = date || new Date().toISOString().split('T')[0];
      const plan = store.getPlan(targetDate);

      if (!plan) {
        return {
          content: [{
            type: 'text' as const,
            text: `No plan found for ${targetDate}. Use generate_daily_plan to create one.`,
          }],
        };
      }

      return { content: [{ type: 'text' as const, text: JSON.stringify(plan, null, 2) }] };
    }
  );

  // Generate a daily plan
  server.tool(
    'generate_daily_plan',
    'Generate an optimized daily schedule based on pending tasks, priorities, and energy pattern. Allocates time blocks intelligently.',
    {
      date: z.string().optional().describe('Date to plan for (YYYY-MM-DD). Defaults to today.'),
      workStartTime: z.string().default('09:00').describe('Work start time (HH:MM)'),
      workEndTime: z.string().default('17:00').describe('Work end time (HH:MM)'),
      energyPattern: z.enum(['morning', 'afternoon', 'evening']).default('morning').describe('When the user is most productive'),
      breakDuration: z.number().default(15).describe('Break duration in minutes'),
      focusBlockDuration: z.number().default(90).describe('Focus block duration in minutes'),
    },
    async ({ date, workStartTime, workEndTime, energyPattern, breakDuration, focusBlockDuration }) => {
      const targetDate = date || new Date().toISOString().split('T')[0];
      const tasks = store.listTasks(undefined, { status: 'todo' })
        .concat(store.listTasks(undefined, { status: 'in_progress' }))
        .sort((a, b) => {
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

      // Generate time blocks
      const timeBlocks: {
        id: string; taskId?: string; title: string;
        startTime: string; endTime: string; type: string;
      }[] = [];

      let currentHour = parseInt(workStartTime.split(':')[0]);
      let currentMin = parseInt(workStartTime.split(':')[1]);
      const endHour = parseInt(workEndTime.split(':')[0]);
      let blockCount = 0;

      for (const task of tasks) {
        if (currentHour >= endHour) break;

        const duration = Math.min(task.estimatedMinutes || focusBlockDuration, focusBlockDuration);
        const endMin = currentMin + duration;
        const endH = currentHour + Math.floor(endMin / 60);
        const endM = endMin % 60;

        if (endH >= endHour) break;

        timeBlocks.push({
          id: uuidv4(),
          taskId: task.id,
          title: task.title,
          startTime: `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`,
          endTime: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
          type: task.priority === 'critical' ? 'focus' : 'task',
        });

        // Add break after every 2 blocks
        currentHour = endH;
        currentMin = endM;
        blockCount++;

        if (blockCount % 2 === 0) {
          const breakEnd = currentMin + breakDuration;
          const breakEndH = currentHour + Math.floor(breakEnd / 60);
          const breakEndM = breakEnd % 60;

          timeBlocks.push({
            id: uuidv4(),
            title: 'Break',
            startTime: `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`,
            endTime: `${String(breakEndH).padStart(2, '0')}:${String(breakEndM).padStart(2, '0')}`,
            type: 'break',
          });

          currentHour = breakEndH;
          currentMin = breakEndM;
        }
      }

      const plan = {
        id: uuidv4(),
        userId: 'user-mcp-001',
        date: targetDate,
        timeBlocks,
        availableHours: endHour - parseInt(workStartTime.split(':')[0]),
        energyPattern,
        createdAt: new Date().toISOString(),
      };

      store.savePlan(plan);

      return {
        content: [{
          type: 'text' as const,
          text: `Daily plan generated for ${targetDate} (${timeBlocks.length} blocks):\n\n${timeBlocks.map((b) => `${b.startTime}-${b.endTime} [${b.type}] ${b.title}`).join('\n')}`,
        }],
      };
    }
  );

  // Add a time block manually
  server.tool(
    'add_time_block',
    'Add a custom time block to the daily plan (meeting, personal event, etc).',
    {
      date: z.string().describe('Date (YYYY-MM-DD)'),
      title: z.string().describe('Block title'),
      startTime: z.string().describe('Start time (HH:MM)'),
      endTime: z.string().describe('End time (HH:MM)'),
      type: z.enum(['task', 'meeting', 'break', 'focus', 'personal']).describe('Block type'),
      taskId: z.string().optional().describe('Associated task ID'),
    },
    async ({ date, title, startTime, endTime, type, taskId }) => {
      let plan = store.getPlan(date);
      if (!plan) {
        plan = {
          id: uuidv4(),
          userId: 'user-mcp-001',
          date,
          timeBlocks: [],
          availableHours: 8,
          energyPattern: 'morning',
          createdAt: new Date().toISOString(),
        };
      }

      const block = { id: uuidv4(), taskId, title, startTime, endTime, type };
      plan.timeBlocks.push(block);
      store.savePlan(plan);

      return {
        content: [{
          type: 'text' as const,
          text: `Added time block: ${startTime}-${endTime} [${type}] "${title}"`,
        }],
      };
    }
  );
}
