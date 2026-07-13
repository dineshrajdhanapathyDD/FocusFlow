import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { store } from '../store.js';

export function registerInsightsTools(server: McpServer) {
  // Get a productivity summary
  server.tool(
    'get_productivity_summary',
    'Generate a productivity summary with key stats, patterns, and actionable suggestions for improvement.',
    {},
    async () => {
      const tasks = store.listTasks();
      const completed = tasks.filter((t) => t.status === 'completed');
      const pending = tasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled');
      const inProgress = tasks.filter((t) => t.status === 'in_progress');

      const totalEstimatedMinutes = pending.reduce((sum, t) => sum + (t.estimatedMinutes || 30), 0);
      const categories = [...new Set(tasks.map((t) => t.category))];

      const summary = {
        overview: {
          total: tasks.length,
          completed: completed.length,
          inProgress: inProgress.length,
          pending: pending.length,
          completionRate: tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0,
        },
        timeEstimate: {
          totalRemainingMinutes: totalEstimatedMinutes,
          totalRemainingHours: Math.round(totalEstimatedMinutes / 60 * 10) / 10,
          averageTaskMinutes: pending.length > 0 ? Math.round(totalEstimatedMinutes / pending.length) : 0,
        },
        categories: categories.map((cat) => ({
          name: cat,
          total: tasks.filter((t) => t.category === cat).length,
          completed: tasks.filter((t) => t.category === cat && t.status === 'completed').length,
        })),
        suggestions: generateSuggestions(tasks, pending, completed),
      };

      return { content: [{ type: 'text' as const, text: JSON.stringify(summary, null, 2) }] };
    }
  );

  // Get focus recommendations
  server.tool(
    'get_focus_recommendations',
    'Get AI-generated recommendations on what to focus on next based on priorities, deadlines, and progress.',
    {
      availableMinutes: z.number().optional().describe('How many minutes of work time the user has available'),
    },
    async ({ availableMinutes }) => {
      const tasks = store.listTasks();
      const pending = tasks
        .filter((t) => t.status !== 'completed' && t.status !== 'cancelled')
        .sort((a, b) => {
          // Score: priority weight + deadline urgency
          const priorityScore = { critical: 40, high: 30, medium: 20, low: 10 };
          let scoreA = priorityScore[a.priority];
          let scoreB = priorityScore[b.priority];

          if (a.dueDate) {
            const daysUntilA = (new Date(a.dueDate).getTime() - Date.now()) / 86400000;
            scoreA += Math.max(0, 30 - daysUntilA * 5);
          }
          if (b.dueDate) {
            const daysUntilB = (new Date(b.dueDate).getTime() - Date.now()) / 86400000;
            scoreB += Math.max(0, 30 - daysUntilB * 5);
          }

          return scoreB - scoreA;
        });

      let recommendations = pending.slice(0, 5);

      if (availableMinutes) {
        // Filter to tasks that fit in the available time
        recommendations = pending.filter((t) => (t.estimatedMinutes || 30) <= availableMinutes).slice(0, 3);
        if (recommendations.length === 0) {
          recommendations = pending.slice(0, 2); // Fallback to top priority
        }
      }

      const result = recommendations.map((t, i) => ({
        rank: i + 1,
        id: t.id,
        title: t.title,
        priority: t.priority,
        estimatedMinutes: t.estimatedMinutes || 30,
        dueDate: t.dueDate,
        reason: t.priority === 'critical' ? 'Critical priority - needs immediate attention'
          : t.dueDate && new Date(t.dueDate).getTime() - Date.now() < 86400000 ? 'Due very soon'
          : t.dueDate && new Date(t.dueDate).getTime() - Date.now() < 3 * 86400000 ? 'Approaching deadline'
          : t.status === 'in_progress' ? 'Already started - maintain momentum'
          : 'High priority in queue',
      }));

      return {
        content: [{
          type: 'text' as const,
          text: `Focus Recommendations${availableMinutes ? ` (${availableMinutes} min available)` : ''}:\n\n${result.map((r) => `${r.rank}. "${r.title}" [${r.priority}] ~${r.estimatedMinutes}min\n   Reason: ${r.reason}`).join('\n\n')}`,
        }],
      };
    }
  );
}

function generateSuggestions(
  allTasks: ReturnType<typeof store.listTasks>,
  pending: ReturnType<typeof store.listTasks>,
  completed: ReturnType<typeof store.listTasks>
): string[] {
  const suggestions: string[] = [];

  const overdue = pending.filter((t) => t.dueDate && new Date(t.dueDate) < new Date());
  if (overdue.length > 0) {
    suggestions.push(`You have ${overdue.length} overdue task(s). Consider rescheduling or prioritizing them.`);
  }

  const critical = pending.filter((t) => t.priority === 'critical');
  if (critical.length > 0) {
    suggestions.push(`${critical.length} critical task(s) need attention. Block focused time for these first.`);
  }

  const largeTasks = pending.filter((t) => (t.estimatedMinutes || 0) > 120 && t.subtasks.length === 0);
  if (largeTasks.length > 0) {
    suggestions.push(`Consider breaking down "${largeTasks[0].title}" into smaller subtasks for better progress tracking.`);
  }

  if (completed.length === 0) {
    suggestions.push('Start with a quick, easy task to build momentum for the day.');
  }

  if (suggestions.length === 0) {
    suggestions.push('You are in good shape! Keep up the consistent work.');
  }

  return suggestions;
}
