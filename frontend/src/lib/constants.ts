export const PRIORITIES = [
  { value: 'critical', label: 'Critical', color: 'red' },
  { value: 'high', label: 'High', color: 'orange' },
  { value: 'medium', label: 'Medium', color: 'yellow' },
  { value: 'low', label: 'Low', color: 'green' },
] as const;

export const STATUSES = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
] as const;

export const DEFAULT_CATEGORIES = [
  'Work',
  'Personal',
  'Health',
  'Learning',
  'Finance',
  'Creative',
  'Social',
  'Admin',
];

export const ENERGY_PATTERNS = [
  { value: 'morning', label: 'Morning Person', description: 'Most productive in the morning' },
  { value: 'afternoon', label: 'Afternoon Peak', description: 'Most productive in the afternoon' },
  { value: 'evening', label: 'Evening Owl', description: 'Most productive in the evening' },
  { value: 'night', label: 'Night Owl', description: 'Most productive at night' },
] as const;

export const AGENT_TYPES = [
  {
    type: 'productivity_coach',
    name: 'Productivity Coach',
    description: 'Analyzes your workload and recommends priorities',
    icon: '🎯',
  },
  {
    type: 'planning',
    name: 'Planning Agent',
    description: 'Creates optimized daily schedules',
    icon: '📅',
  },
  {
    type: 'breakdown',
    name: 'Breakdown Agent',
    description: 'Splits complex tasks into actionable subtasks',
    icon: '🔨',
  },
  {
    type: 'motivation',
    name: 'Motivation Agent',
    description: 'Generates personalized encouragement',
    icon: '💪',
  },
  {
    type: 'review',
    name: 'Review Agent',
    description: 'Produces end-of-day productivity summaries',
    icon: '📊',
  },
] as const;

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const KEYBOARD_SHORTCUTS = {
  newTask: 'n',
  search: '/',
  dashboard: '1',
  tasks: '2',
  planner: '3',
  aiAssistant: '4',
  analytics: '5',
  settings: '6',
  toggleTheme: 't',
} as const;
