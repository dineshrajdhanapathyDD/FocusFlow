import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { GamificationState, Achievement, DailyChallenge } from './types';
import { getLevel } from './types';

const STORAGE_KEY = 'focusflow_gamification';

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: 'ach-1', title: 'First Step', description: 'Complete your first task', icon: '🎯', xp: 50, category: 'tasks', requirement: 1, progress: 0 },
  { id: 'ach-2', title: 'Getting Started', description: 'Complete 5 tasks', icon: '🚀', xp: 100, category: 'tasks', requirement: 5, progress: 0 },
  { id: 'ach-3', title: 'Task Machine', description: 'Complete 25 tasks', icon: '⚡', xp: 250, category: 'tasks', requirement: 25, progress: 0 },
  { id: 'ach-4', title: 'Centurion', description: 'Complete 100 tasks', icon: '💯', xp: 500, category: 'milestones', requirement: 100, progress: 0 },
  { id: 'ach-5', title: 'On Fire', description: '3-day streak', icon: '🔥', xp: 75, category: 'streaks', requirement: 3, progress: 0 },
  { id: 'ach-6', title: 'Consistency King', description: '7-day streak', icon: '👑', xp: 200, category: 'streaks', requirement: 7, progress: 0 },
  { id: 'ach-7', title: 'Unstoppable', description: '30-day streak', icon: '🏆', xp: 1000, category: 'streaks', requirement: 30, progress: 0 },
  { id: 'ach-8', title: 'AI Explorer', description: 'Use AI assistant 10 times', icon: '🤖', xp: 150, category: 'ai', requirement: 10, progress: 0 },
  { id: 'ach-9', title: 'Cloud Student', description: 'Complete 5 AWS learning tasks', icon: '☁️', xp: 200, category: 'learning', requirement: 5, progress: 0 },
  { id: 'ach-10', title: 'Deep Focus', description: 'Log 500 minutes of focus time', icon: '🧘', xp: 300, category: 'milestones', requirement: 500, progress: 0 },
  { id: 'ach-11', title: 'Early Bird', description: 'Complete a task before 9 AM', icon: '🌅', xp: 75, category: 'tasks', requirement: 1, progress: 0 },
  { id: 'ach-12', title: 'Night Owl', description: 'Complete a task after 10 PM', icon: '🦉', xp: 75, category: 'tasks', requirement: 1, progress: 0 },
];

function generateDailyChallenges(): DailyChallenge[] {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  return [
    { id: `dc-${Date.now()}-1`, title: 'Complete 3 tasks', description: 'Finish any 3 tasks today', xp: 50, type: 'tasks', target: 3, progress: 0, completed: false, expiresAt: tomorrow.toISOString() },
    { id: `dc-${Date.now()}-2`, title: '60 min focus', description: 'Log 60 minutes of focused work', xp: 75, type: 'focus', target: 60, progress: 0, completed: false, expiresAt: tomorrow.toISOString() },
    { id: `dc-${Date.now()}-3`, title: 'Ask the AI', description: 'Get a recommendation from AI', xp: 30, type: 'ai', target: 1, progress: 0, completed: false, expiresAt: tomorrow.toISOString() },
  ];
}

const defaultState: GamificationState = {
  xp: 450,
  level: 3,
  streak: 5,
  longestStreak: 8,
  achievements: DEFAULT_ACHIEVEMENTS.map((a, i) => ({
    ...a,
    progress: i < 3 ? a.requirement : Math.floor(a.requirement * Math.random() * 0.7),
    unlockedAt: i < 3 ? new Date(Date.now() - i * 86400000).toISOString() : undefined,
  })),
  dailyChallenges: generateDailyChallenges(),
  weeklyXP: [60, 85, 120, 45, 90, 30, 0],
  totalTasksCompleted: 28,
  totalFocusMinutes: 420,
};

interface GamificationContextType {
  state: GamificationState;
  addXP: (amount: number, reason: string) => void;
  completeChallenge: (challengeId: string) => void;
  incrementStreak: () => void;
  unlockAchievement: (achievementId: string) => void;
  levelInfo: ReturnType<typeof getLevel>;
  recentReward: { xp: number; reason: string } | null;
  clearReward: () => void;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export function GamificationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GamificationState>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { return JSON.parse(stored); } catch { /* fallback */ }
    }
    return defaultState;
  });

  const [recentReward, setRecentReward] = useState<{ xp: number; reason: string } | null>(null);

  const persist = (newState: GamificationState) => {
    setState(newState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  };

  const addXP = useCallback((amount: number, reason: string) => {
    setState((prev) => {
      const newState = { ...prev, xp: prev.xp + amount };
      newState.level = getLevel(newState.xp).level;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
    setRecentReward({ xp: amount, reason });
    setTimeout(() => setRecentReward(null), 3000);
  }, []);

  const completeChallenge = useCallback((challengeId: string) => {
    setState((prev) => {
      const newState = { ...prev };
      const challenge = newState.dailyChallenges.find((c) => c.id === challengeId);
      if (challenge && !challenge.completed) {
        challenge.completed = true;
        newState.xp += challenge.xp;
        newState.level = getLevel(newState.xp).level;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  }, []);

  const incrementStreak = useCallback(() => {
    setState((prev) => {
      const newStreak = prev.streak + 1;
      const newState = {
        ...prev,
        streak: newStreak,
        longestStreak: Math.max(prev.longestStreak, newStreak),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  }, []);

  const unlockAchievement = useCallback((achievementId: string) => {
    setState((prev) => {
      const newState = { ...prev };
      const achievement = newState.achievements.find((a) => a.id === achievementId);
      if (achievement && !achievement.unlockedAt) {
        achievement.unlockedAt = new Date().toISOString();
        achievement.progress = achievement.requirement;
        newState.xp += achievement.xp;
        newState.level = getLevel(newState.xp).level;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  }, []);

  const clearReward = useCallback(() => setRecentReward(null), []);
  const levelInfo = getLevel(state.xp);

  return (
    <GamificationContext.Provider
      value={{ state, addXP, completeChallenge, incrementStreak, unlockAchievement, levelInfo, recentReward, clearReward }}
    >
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification(): GamificationContextType {
  const context = useContext(GamificationContext);
  if (!context) throw new Error('useGamification must be used within a GamificationProvider');
  return context;
}
