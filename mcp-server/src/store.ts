/**
 * In-memory store for local/development mode.
 * In production, replace with DynamoDB calls.
 */
import { v4 as uuidv4 } from 'uuid';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  category: string;
  tags: string[];
  dueDate?: string;
  estimatedMinutes?: number;
  actualMinutes?: number;
  progress: number;
  subtasks: { id: string; title: string; completed: boolean; estimatedMinutes?: number }[];
  order: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface TimeBlock {
  id: string;
  taskId?: string;
  title: string;
  startTime: string;
  endTime: string;
  type: 'task' | 'meeting' | 'break' | 'focus' | 'personal';
}

export interface DailyPlan {
  id: string;
  userId: string;
  date: string;
  timeBlocks: TimeBlock[];
  availableHours: number;
  energyPattern: string;
  createdAt: string;
}

// Seed data
const DEFAULT_USER = 'user-mcp-001';

class Store {
  private tasks: Map<string, Task> = new Map();
  private plans: Map<string, DailyPlan> = new Map();

  constructor() {
    this.seed();
  }

  private seed() {
    const seedTasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[] = [
      { userId: DEFAULT_USER, title: 'Design new landing page', description: 'Create a modern, conversion-optimized landing page', priority: 'high', status: 'in_progress', category: 'Work', tags: ['design', 'frontend'], dueDate: this.futureDate(2), estimatedMinutes: 180, progress: 45, subtasks: [{ id: 'st-1', title: 'Wireframe', completed: true }, { id: 'st-2', title: 'Visual design', completed: false }], order: 1 },
      { userId: DEFAULT_USER, title: 'Implement authentication system', description: 'JWT auth with Cognito', priority: 'critical', status: 'todo', category: 'Work', tags: ['backend', 'security'], dueDate: this.futureDate(1), estimatedMinutes: 240, progress: 0, subtasks: [], order: 2 },
      { userId: DEFAULT_USER, title: 'Write API documentation', priority: 'high', status: 'todo', category: 'Work', tags: ['docs'], dueDate: this.futureDate(3), estimatedMinutes: 120, progress: 0, subtasks: [], order: 3 },
      { userId: DEFAULT_USER, title: '30 min cardio', description: 'Morning gym session', priority: 'medium', status: 'todo', category: 'Health', tags: ['exercise'], estimatedMinutes: 45, progress: 0, subtasks: [], order: 4 },
      { userId: DEFAULT_USER, title: 'Read TypeScript patterns book', description: 'Chapters 5-7', priority: 'low', status: 'in_progress', category: 'Learning', tags: ['reading', 'typescript'], dueDate: this.futureDate(7), estimatedMinutes: 120, progress: 30, subtasks: [], order: 5 },
    ];

    seedTasks.forEach((t) => {
      const id = uuidv4();
      const now = new Date().toISOString();
      this.tasks.set(id, { ...t, id, createdAt: now, updatedAt: now });
    });
  }

  private futureDate(days: number): string {
    return new Date(Date.now() + days * 86400000).toISOString().split('T')[0];
  }

  // Tasks
  listTasks(userId = DEFAULT_USER, filters?: { status?: string; priority?: string; category?: string }): Task[] {
    let tasks = Array.from(this.tasks.values()).filter((t) => t.userId === userId);
    if (filters?.status) tasks = tasks.filter((t) => t.status === filters.status);
    if (filters?.priority) tasks = tasks.filter((t) => t.priority === filters.priority);
    if (filters?.category) tasks = tasks.filter((t) => t.category === filters.category);
    return tasks.sort((a, b) => a.order - b.order);
  }

  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  createTask(data: Partial<Task>): Task {
    const id = uuidv4();
    const now = new Date().toISOString();
    const task: Task = {
      id,
      userId: data.userId || DEFAULT_USER,
      title: data.title || 'Untitled Task',
      description: data.description,
      priority: data.priority || 'medium',
      status: 'todo',
      category: data.category || 'Work',
      tags: data.tags || [],
      dueDate: data.dueDate,
      estimatedMinutes: data.estimatedMinutes,
      progress: 0,
      subtasks: [],
      order: this.tasks.size + 1,
      createdAt: now,
      updatedAt: now,
    };
    this.tasks.set(id, task);
    return task;
  }

  updateTask(taskId: string, updates: Partial<Task>): Task | null {
    const task = this.tasks.get(taskId);
    if (!task) return null;
    const updated = { ...task, ...updates, updatedAt: new Date().toISOString() };
    if (updates.status === 'completed' && task.status !== 'completed') {
      updated.completedAt = new Date().toISOString();
      updated.progress = 100;
    }
    this.tasks.set(taskId, updated);
    return updated;
  }

  deleteTask(taskId: string): boolean {
    return this.tasks.delete(taskId);
  }

  // Plans
  getPlan(date: string, userId = DEFAULT_USER): DailyPlan | undefined {
    return this.plans.get(`${userId}:${date}`);
  }

  savePlan(plan: DailyPlan): DailyPlan {
    this.plans.set(`${plan.userId}:${plan.date}`, plan);
    return plan;
  }

  // Analytics
  getMetrics(userId = DEFAULT_USER) {
    const tasks = this.listTasks(userId);
    const completed = tasks.filter((t) => t.status === 'completed');
    const pending = tasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled');
    const overdue = pending.filter((t) => t.dueDate && new Date(t.dueDate) < new Date());

    return {
      totalTasks: tasks.length,
      completed: completed.length,
      pending: pending.length,
      overdue: overdue.length,
      completionRate: tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0,
      topCategories: this.categoryStats(tasks),
      upcomingDeadlines: pending
        .filter((t) => t.dueDate)
        .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
        .slice(0, 5)
        .map((t) => ({ id: t.id, title: t.title, dueDate: t.dueDate, priority: t.priority })),
    };
  }

  private categoryStats(tasks: Task[]) {
    const cats = new Map<string, number>();
    tasks.forEach((t) => cats.set(t.category, (cats.get(t.category) || 0) + 1));
    return Array.from(cats.entries()).map(([category, count]) => ({ category, count }));
  }
}

export const store = new Store();
