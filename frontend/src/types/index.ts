// ===== Task Types =====
export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';
export type EnergyLevel = 'high' | 'medium' | 'low';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  category: string;
  tags: string[];
  dueDate?: string;
  estimatedMinutes?: number;
  actualMinutes?: number;
  progress: number;
  subtasks: Subtask[];
  order: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  estimatedMinutes?: number;
}

export interface TaskFormData {
  title: string;
  description?: string;
  priority: Priority;
  category: string;
  tags: string[];
  dueDate?: string;
  estimatedMinutes?: number;
}

// ===== Planner Types =====
export interface TimeBlock {
  id: string;
  taskId?: string;
  title: string;
  startTime: string;
  endTime: string;
  type: 'task' | 'meeting' | 'break' | 'focus' | 'personal';
  color?: string;
}

export interface DailyPlan {
  id: string;
  userId: string;
  date: string;
  timeBlocks: TimeBlock[];
  availableHours: number;
  energyPattern: TimeOfDay;
  createdAt: string;
}

export interface PlannerSettings {
  workStartTime: string;
  workEndTime: string;
  breakDuration: number;
  focusBlockDuration: number;
  energyPattern: TimeOfDay;
  meetings: Meeting[];
}

export interface Meeting {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  recurring: boolean;
  days?: number[];
}

// ===== AI Types =====
export interface AIRecommendation {
  taskId: string;
  urgency: number;
  importance: number;
  estimatedEffort: number;
  recommendedOrder: number;
  reasoning: string;
  confidence: number;
}

export interface AIPrioritization {
  recommendations: AIRecommendation[];
  summary: string;
  timestamp: string;
}

export interface AITaskBreakdown {
  taskId: string;
  subtasks: {
    title: string;
    estimatedMinutes: number;
    order: number;
  }[];
  milestones: {
    title: string;
    subtaskIds: number[];
  }[];
  totalEstimatedMinutes: number;
  confidence: number;
}

export interface AIInsight {
  id: string;
  type: 'daily_summary' | 'weekly_review' | 'suggestion' | 'burnout_warning' | 'focus_tip' | 'motivation';
  title: string;
  content: string;
  confidence: number;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface AIDailyPlan {
  timeBlocks: TimeBlock[];
  reasoning: string;
  productivityScore: number;
  tips: string[];
}

// ===== Agent Types =====
export type AgentType = 'productivity_coach' | 'planning' | 'breakdown' | 'motivation' | 'review';

export interface AgentMessage {
  id: string;
  agentType: AgentType;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface AgentResponse {
  message: string;
  data?: Record<string, unknown>;
  confidence: number;
  agentType: AgentType;
}

// ===== Analytics Types =====
export interface ProductivityMetrics {
  tasksCompleted: number;
  tasksPending: number;
  completionRate: number;
  averageCompletionTime: number;
  streakDays: number;
  totalFocusMinutes: number;
  weeklyData: WeeklyData[];
  categoryBreakdown: CategoryBreakdown[];
  aiProductivityScore: number;
}

export interface WeeklyData {
  day: string;
  completed: number;
  created: number;
  focusMinutes: number;
}

export interface CategoryBreakdown {
  category: string;
  count: number;
  completedCount: number;
  totalMinutes: number;
}

// ===== User Types =====
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  preferences: UserPreferences;
  createdAt: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  energyPattern: TimeOfDay;
  workStartTime: string;
  workEndTime: string;
  breakDuration: number;
  focusBlockDuration: number;
  notifications: NotificationPreferences;
  categories: string[];
}

export interface NotificationPreferences {
  deadlineReminder: boolean;
  dailyDigest: boolean;
  overdueAlert: boolean;
  productivityInsights: boolean;
}

// ===== Notification Types =====
export interface AppNotification {
  id: string;
  type: 'deadline' | 'overdue' | 'reminder' | 'insight' | 'achievement';
  title: string;
  message: string;
  read: boolean;
  taskId?: string;
  createdAt: string;
}

// ===== API Types =====
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string>;
}
