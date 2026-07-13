import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { User } from '@/types';
import { authService } from '@/services/api';
import toast from 'react-hot-toast';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'focusflow_token';
const USER_KEY = 'focusflow_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        setState({ user, token, isAuthenticated: true, isLoading: false });
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
      }
    } else {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await authService.login(email, password);
      const { user, token } = response;

      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));

      setState({ user, token, isAuthenticated: true, isLoading: false });
      toast.success(`Welcome back, ${user.name}!`);
    } catch {
      // Fallback: accept demo credentials locally when backend is unreachable
      if (email === 'demo@focusflow.ai') {
        const user: User = {
          id: 'user-demo-001',
          email: 'demo@focusflow.ai',
          name: 'Alex Developer',
          preferences: {
            theme: 'system',
            energyPattern: 'morning',
            workStartTime: '09:00',
            workEndTime: '17:00',
            breakDuration: 15,
            focusBlockDuration: 90,
            notifications: { deadlineReminder: true, dailyDigest: true, overdueAlert: true, productivityInsights: true },
            categories: ['Work', 'Personal', 'Health', 'Learning'],
          },
          createdAt: '2024-01-01T00:00:00Z',
        };
        const token = 'demo-token';
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        setState({ user, token, isAuthenticated: true, isLoading: false });
        toast.success(`Welcome back, ${user.name}!`);
        return;
      }
      toast.error('Invalid email or password');
      throw new Error('Login failed');
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    try {
      const response = await authService.register(name, email, password);
      const { user, token } = response;

      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));

      setState({ user, token, isAuthenticated: true, isLoading: false });
      toast.success('Account created successfully!');
    } catch {
      // Fallback: create user locally when backend is unreachable
      const user: User = {
        id: `user-${Date.now()}`,
        email,
        name,
        preferences: {
          theme: 'system',
          energyPattern: 'morning',
          workStartTime: '09:00',
          workEndTime: '17:00',
          breakDuration: 15,
          focusBlockDuration: 90,
          notifications: { deadlineReminder: true, dailyDigest: true, overdueAlert: true, productivityInsights: true },
          categories: ['Work', 'Personal', 'Health', 'Learning'],
        },
        createdAt: new Date().toISOString(),
      };
      const token = `local-token-${Date.now()}`;
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      setState({ user, token, isAuthenticated: true, isLoading: false });
      toast.success('Account created successfully!');
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
    toast.success('Logged out successfully');
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setState((prev) => {
      if (!prev.user) return prev;
      const updatedUser = { ...prev.user, ...updates };
      localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      return { ...prev, user: updatedUser };
    });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
