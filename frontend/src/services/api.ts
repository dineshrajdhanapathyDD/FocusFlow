import { API_BASE_URL } from '@/lib/constants';
import type {
  Task,
  TaskFormData,
  DailyPlan,
  AIInsight,
  AIPrioritization,
  AITaskBreakdown,
  AIDailyPlan,
  AgentResponse,
  AgentType,
  ProductivityMetrics,
  User,
  AppNotification,
  PlannerSettings,
} from '@/types';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('focusflow_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
  }

  post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

const api = new ApiClient(API_BASE_URL);

// ===== Auth Service =====
export const authService = {
  login: (email: string, password: string) =>
    api.post<{ user: User; token: string }>('/auth/login', { email, password }),

  register: (name: string, email: string, password: string) =>
    api.post<{ user: User; token: string }>('/auth/register', { name, email, password }),

  getProfile: () => api.get<User>('/auth/profile'),

  updateProfile: (data: Partial<User>) => api.put<User>('/auth/profile', data),
};

// ===== Tasks Service =====
export const taskService = {
  getAll: () => api.get<Task[]>('/tasks'),

  getById: (id: string) => api.get<Task>(`/tasks/${id}`),

  create: (data: TaskFormData) => api.post<Task>('/tasks', data),

  update: (id: string, data: Partial<Task>) => api.put<Task>(`/tasks/${id}`, data),

  delete: (id: string) => api.delete<void>(`/tasks/${id}`),

  reorder: (taskIds: string[]) => api.put<void>('/tasks/reorder', { taskIds }),
};

// ===== AI Service =====
export const aiService = {
  prioritize: (taskIds: string[]) =>
    api.post<AIPrioritization>('/ai/prioritize', { taskIds }),

  breakdownTask: (taskId: string) =>
    api.post<AITaskBreakdown>('/ai/breakdown', { taskId }),

  generatePlan: (settings: PlannerSettings) =>
    api.post<AIDailyPlan>('/ai/plan', settings),

  getInsights: () => api.get<AIInsight[]>('/ai/insights'),

  chat: (message: string, agentType: AgentType, context?: Record<string, unknown>) =>
    api.post<AgentResponse>('/ai/chat', { message, agentType, context }),
};

// ===== Planner Service =====
export const plannerService = {
  getDailyPlan: (date: string) => api.get<DailyPlan>(`/planner/${date}`),

  savePlan: (plan: DailyPlan) => api.post<DailyPlan>('/planner', plan),

  updatePlan: (id: string, plan: Partial<DailyPlan>) => api.put<DailyPlan>(`/planner/${id}`, plan),
};

// ===== Analytics Service =====
export const analyticsService = {
  getMetrics: (period?: string) =>
    api.get<ProductivityMetrics>(`/analytics${period ? `?period=${period}` : ''}`),
};

// ===== Notifications Service =====
export const notificationService = {
  getAll: () => api.get<AppNotification[]>('/notifications'),

  markRead: (id: string) => api.put<void>(`/notifications/${id}/read`),

  markAllRead: () => api.put<void>('/notifications/read-all'),
};

// ===== Strands Agents Service (Agentic Mode) =====
export interface AgenticResponse {
  response: string;
  agent_type: string;
  tool_calls: { tool: string; input: Record<string, unknown> }[];
  success: boolean;
  fallback?: boolean;
}

export const agentService = {
  chat: (message: string, agentType = 'orchestrator') =>
    api.post<AgenticResponse>('/agent/chat', { message, agent_type: agentType }),

  coach: (message: string) =>
    api.post<AgenticResponse>('/agent/coach', { message }),

  plan: (date?: string, message?: string) =>
    api.post<AgenticResponse>('/agent/plan', { date, message }),

  breakdown: (taskId: string, message?: string) =>
    api.post<AgenticResponse>('/agent/breakdown', { task_id: taskId, message }),

  review: () =>
    api.post<AgenticResponse>('/agent/review', {}),

  listTools: () =>
    api.get<{ count: number; tools: { name: string; description: string }[] }>('/agent/tools'),

  // AWS Learning Agent
  awsDigest: (interests?: string[]) =>
    api.post<AgenticResponse>('/agent/aws/digest', { interests }),

  awsLearn: (message: string, topic?: string) =>
    api.post<AgenticResponse>('/agent/aws/learn', { message, topic }),

  awsEvents: () =>
    api.post<AgenticResponse>('/agent/aws/events', {}),

  awsSkillPlan: (message: string) =>
    api.post<AgenticResponse>('/agent/aws/skill-plan', { message }),
};

export default api;
