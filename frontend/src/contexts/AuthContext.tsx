import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { User } from '@/types';
import { authService } from '@/services/api';
import { initiateOTPLogin, verifyOTP, signOut as cognitoSignOut, getCurrentSession, isCognitoConfigured } from '@/services/cognito';
import toast from 'react-hot-toast';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  sendOTP: (email: string) => Promise<void>;
  verifyOTPCode: (code: string) => Promise<void>;
  login: (email: string, otp: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'focusflow_token';
const USER_KEY = 'focusflow_user';

function createUserFromEmail(email: string): User {
  const name = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return {
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
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const [pendingEmail, setPendingEmail] = useState<string>('');

  // Check for existing session on mount
  useEffect(() => {
    async function checkSession() {
      // Try Cognito session first
      if (isCognitoConfigured()) {
        try {
          const session = await getCurrentSession();
          if (session) {
            const user = createUserFromEmail(session.email);
            user.name = session.name || user.name;
            localStorage.setItem(TOKEN_KEY, session.idToken);
            localStorage.setItem(USER_KEY, JSON.stringify(user));
            setState({ user, token: session.idToken, isAuthenticated: true, isLoading: false });
            return;
          }
        } catch {
          // Fall through to localStorage check
        }
      }

      // Fall back to localStorage
      const token = localStorage.getItem(TOKEN_KEY);
      const userStr = localStorage.getItem(USER_KEY);

      if (token && userStr) {
        try {
          const user = JSON.parse(userStr) as User;
          setState({ user, token, isAuthenticated: true, isLoading: false });
          return;
        } catch {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
        }
      }

      setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }

    checkSession();
  }, []);

  // Step 1: Send OTP to email
  const sendOTP = useCallback(async (email: string) => {
    setPendingEmail(email);

    if (isCognitoConfigured()) {
      // Real Cognito flow
      await initiateOTPLogin(email);
    }
    // If Cognito not configured, we just store the email and accept any code in verify
  }, []);

  // Step 2: Verify OTP code
  const verifyOTPCode = useCallback(async (code: string) => {
    if (isCognitoConfigured()) {
      // Real Cognito verification
      const { idToken, email } = await verifyOTP(code);
      const user = createUserFromEmail(email || pendingEmail);

      localStorage.setItem(TOKEN_KEY, idToken);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      setState({ user, token: idToken, isAuthenticated: true, isLoading: false });
      toast.success(`Welcome, ${user.name}!`);
    } else {
      // Local/demo mode - accept any 4+ digit code
      if (code.length < 4) {
        throw new Error('Invalid OTP code');
      }
      const token = `local-token-${Date.now()}`;
      const user = createUserFromEmail(pendingEmail);

      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      setState({ user, token, isAuthenticated: true, isLoading: false });
      toast.success(`Welcome, ${user.name}!`);
    }
  }, [pendingEmail]);

  // Legacy login method (used by LoginPage directly)
  const login = useCallback(async (email: string, _otp: string) => {
    try {
      const response = await authService.login(email, _otp);
      const { user, token } = response;
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      setState({ user, token, isAuthenticated: true, isLoading: false });
      toast.success(`Welcome, ${user.name}!`);
    } catch {
      // Fallback: create user locally
      const token = `local-token-${Date.now()}`;
      const user = createUserFromEmail(email);
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      setState({ user, token, isAuthenticated: true, isLoading: false });
      toast.success(`Welcome, ${user.name}!`);
    }
  }, []);

  const register = useCallback(async (_name: string, email: string, _password: string) => {
    // With OTP flow, register is the same as login
    await login(email, 'register');
  }, [login]);

  const logout = useCallback(() => {
    if (isCognitoConfigured()) {
      cognitoSignOut();
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
    toast.success('Logged out');
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
    <AuthContext.Provider value={{ ...state, sendOTP, verifyOTPCode, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
