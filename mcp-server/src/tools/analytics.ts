import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { store } from '../store.js';

export function registerAnalyticsTools(server: McpServer) {
  // Get productivity metrics
  server.tool(
    'get_productivity_metrics',
    'Get overall productivity metrics: task counts, completion rate, overdue items, categories breakdown, and upcoming deadlines.',
    {},
    async () => {
      const metrics = store.getMetrics();
      return { content: [{ type: 'text' as const, text: JSON.stringify(metrics, null, 2) }] };
    }
  );

  // Get workload assessment
  server.tool(
    'assess_workload',
    'Analyze current workload and provide an assessment. Returns task distribution by priority, overdue count, and estimated hours remaining.',
    {},
    async () => {
      const tasks = store.listTasks();
      const pending = tasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled');

      const byPriority = {
        critical: pending.filter((t) => t.priority === 'critical').length,
        high: pending.filter((t) => t.priority === 'high').length,
        medium: pending.filter((t) => t.priority === 'medium').length,
        low: pending.filter((t) => t.priority === 'low').length,
      };

      const totalEstimatedMinutes = pending.reduce((sum, t) => sum + (t.estimatedMinutes || 30), 0);
      const overdue = pending.filter((t) => t.dueDate && new Date(t.dueDate) < new Date());
      const dueSoon = pending.filter((t) => {
        if (!t.dueDate) return false;
        const diff = new Date(t.dueDate).getTime() - Date.now();
        return diff > 0 && diff < 2 * 86400000; // within 2 days
      });

      let assessment: string;
      if (byPriority.critical > 2 || overdue.length > 3) assessment = 'overloaded';
      else if (pending.length > 10 || byPriority.critical > 0) assessment = 'heavy';
      else if (pending.length > 5) assessment = 'balanced';
      else assessment = 'light';

      const result = {
        assessment,
        totalPending: pending.length,
        byPriority,
        estimatedHoursRemaining: Math.round(totalEstimatedMinutes / 60 * 10) / 10,
        overdueCount: overdue.length,
        dueSoon: dueSoon.map((t) => ({ id: t.id, title: t.title, dueDate: t.dueDate, priority: t.priority })),
        recommendation: assessment === 'overloaded'
          ? 'Consider delegating or rescheduling lower-priority tasks. Focus only on critical items today.'
          : assessment === 'heavy'
          ? 'Prioritize the critical task first. Consider breaking large tasks into smaller pieces.'
          : assessment === 'balanced'
          ? 'Good workload level. Focus on high-priority items during your peak energy hours.'
          : 'Light workload. Great time to tackle learning goals or plan ahead.',
      };

      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // Get overdue tasks
  server.tool(
    'get_overdue_tasks',
    'List all tasks that are past their due date and not yet completed.',
    {},
    async () => {
      const tasks = store.listTasks();
      const overdue = tasks.filter(
        (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed' && t.status !== 'cancelled'
      );

      if (overdue.length === 0) {
        return { content: [{ type: 'text' as const, text: 'No overdue tasks. Great job staying on track!' }] };
      }

      return {
        content: [{
          type: 'text' as const,
          text: `${overdue.length} overdue task(s):\n\n${overdue.map((t) => `- [${t.priority.toUpperCase()}] "${t.title}" (due ${t.dueDate})`).join('\n')}`,
        }],
      };
    }
  );
}
