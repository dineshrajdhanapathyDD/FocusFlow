import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { store } from '../store.js';

export function registerTaskTools(server: McpServer) {
  // List tasks with optional filters
  server.tool(
    'list_tasks',
    'List all tasks. Optionally filter by status, priority, or category.',
    {
      status: z.enum(['todo', 'in_progress', 'completed', 'cancelled']).optional().describe('Filter by task status'),
      priority: z.enum(['critical', 'high', 'medium', 'low']).optional().describe('Filter by priority level'),
      category: z.string().optional().describe('Filter by category name'),
    },
    async ({ status, priority, category }) => {
      const tasks = store.listTasks(undefined, { status, priority, category });
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(tasks.map((t) => ({
            id: t.id,
            title: t.title,
            priority: t.priority,
            status: t.status,
            category: t.category,
            dueDate: t.dueDate,
            estimatedMinutes: t.estimatedMinutes,
            progress: t.progress,
            tags: t.tags,
          })), null, 2),
        }],
      };
    }
  );

  // Get detailed task info
  server.tool(
    'get_task',
    'Get full details of a specific task by ID, including subtasks and progress.',
    {
      taskId: z.string().describe('The task ID to retrieve'),
    },
    async ({ taskId }) => {
      const task = store.getTask(taskId);
      if (!task) {
        return { content: [{ type: 'text' as const, text: 'Error: Task not found' }], isError: true };
      }
      return { content: [{ type: 'text' as const, text: JSON.stringify(task, null, 2) }] };
    }
  );

  // Create a new task
  server.tool(
    'create_task',
    'Create a new task with title, priority, category, and optional details.',
    {
      title: z.string().describe('Task title (required)'),
      description: z.string().optional().describe('Detailed description'),
      priority: z.enum(['critical', 'high', 'medium', 'low']).default('medium').describe('Priority level'),
      category: z.string().default('Work').describe('Task category'),
      tags: z.array(z.string()).optional().describe('Tags for organization'),
      dueDate: z.string().optional().describe('Due date in YYYY-MM-DD format'),
      estimatedMinutes: z.number().optional().describe('Estimated time in minutes'),
    },
    async (params) => {
      const task = store.createTask(params);
      return {
        content: [{
          type: 'text' as const,
          text: `Task created successfully:\n${JSON.stringify({ id: task.id, title: task.title, priority: task.priority, category: task.category }, null, 2)}`,
        }],
      };
    }
  );

  // Update a task
  server.tool(
    'update_task',
    'Update an existing task. Can change status, priority, progress, or any other field.',
    {
      taskId: z.string().describe('The task ID to update'),
      title: z.string().optional().describe('New title'),
      status: z.enum(['todo', 'in_progress', 'completed', 'cancelled']).optional().describe('New status'),
      priority: z.enum(['critical', 'high', 'medium', 'low']).optional().describe('New priority'),
      progress: z.number().min(0).max(100).optional().describe('Progress percentage (0-100)'),
      dueDate: z.string().optional().describe('New due date (YYYY-MM-DD)'),
      estimatedMinutes: z.number().optional().describe('Updated time estimate'),
    },
    async ({ taskId, ...updates }) => {
      const task = store.updateTask(taskId, updates);
      if (!task) {
        return { content: [{ type: 'text' as const, text: 'Error: Task not found' }], isError: true };
      }
      return {
        content: [{
          type: 'text' as const,
          text: `Task updated: "${task.title}" - Status: ${task.status}, Priority: ${task.priority}, Progress: ${task.progress}%`,
        }],
      };
    }
  );

  // Complete a task
  server.tool(
    'complete_task',
    'Mark a task as completed.',
    {
      taskId: z.string().describe('The task ID to complete'),
    },
    async ({ taskId }) => {
      const task = store.updateTask(taskId, { status: 'completed' });
      if (!task) {
        return { content: [{ type: 'text' as const, text: 'Error: Task not found' }], isError: true };
      }
      return { content: [{ type: 'text' as const, text: `Task "${task.title}" marked as completed.` }] };
    }
  );

  // Delete a task
  server.tool(
    'delete_task',
    'Permanently delete a task.',
    {
      taskId: z.string().describe('The task ID to delete'),
    },
    async ({ taskId }) => {
      const success = store.deleteTask(taskId);
      if (!success) {
        return { content: [{ type: 'text' as const, text: 'Error: Task not found' }], isError: true };
      }
      return { content: [{ type: 'text' as const, text: 'Task deleted successfully.' }] };
    }
  );

  // Batch create tasks (useful for breakdown agent)
  server.tool(
    'batch_create_tasks',
    'Create multiple tasks at once. Useful for breaking down a large task into subtasks.',
    {
      tasks: z.array(z.object({
        title: z.string(),
        description: z.string().optional(),
        priority: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
        category: z.string().default('Work'),
        estimatedMinutes: z.number().optional(),
        dueDate: z.string().optional(),
      })).describe('Array of tasks to create'),
    },
    async ({ tasks }) => {
      const created = tasks.map((t) => store.createTask(t));
      return {
        content: [{
          type: 'text' as const,
          text: `Created ${created.length} tasks:\n${created.map((t) => `- [${t.id}] ${t.title}`).join('\n')}`,
        }],
      };
    }
  );
}
