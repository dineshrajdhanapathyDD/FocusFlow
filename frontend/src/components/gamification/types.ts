export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xp: number;
  unlockedAt?: string;
  category: 'tasks' | 'streaks' | 'ai' | 'learning' | 'milestones';
  requirement: number;
  progress: number;
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  xp: number;
  type: 'tasks' | 'focus' | 'streak' | 'ai';
  target: number;
  progress: number;
  completed: boolean;
  expiresAt: string;
}

export interface GamificationState {
  xp: number;
  level: number;
  streak: number;
  longestStreak: number;
  achievements: Achievement[];
  dailyChallenges: DailyChallenge[];
  weeklyXP: number[];
  totalTasksCompleted: number;
  totalFocusMinutes: number;
}

export function getLevel(xp: number): { level: number; current: number; required: number; progress: number } {
  // Each level requires progressively more XP
  const baseXP = 100;
  const multiplier = 1.5;
  let level = 1;
  let totalRequired = 0;
  let levelRequired = baseXP;

  while (totalRequired + levelRequired <= xp) {
    totalRequired += levelRequired;
    level++;
    levelRequired = Math.round(baseXP * Math.pow(multiplier, level - 1));
  }

  const current = xp - totalRequired;
  return { level, current, required: levelRequired, progress: (current / levelRequired) * 100 };
}

export function getLevelTitle(level: number): string {
  if (level <= 2) return 'Beginner';
  if (level <= 5) return 'Productive';
  if (level <= 8) return 'Focused';
  if (level <= 12) return 'Master';
  if (level <= 16) return 'Grandmaster';
  return 'Legend';
}
