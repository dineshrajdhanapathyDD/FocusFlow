import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './contexts/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TasksPage from './pages/TasksPage';
import PlannerPage from './pages/PlannerPage';
import AIAssistantPage from './pages/AIAssistantPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import AWSHubPage from './pages/AWSHubPage';
import { OnboardingFlow, useOnboarding } from './components/onboarding';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary-500/20" />
          <div className="h-4 w-32 rounded bg-surface-200 dark:bg-surface-700" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const { isAuthenticated } = useAuth();
  const { completed: onboardingComplete, complete: completeOnboarding } = useOnboarding();
  const { user } = useAuth();

  return (
    <>
      {/* Onboarding overlay - shows after first login */}
      <AnimatePresence>
        {isAuthenticated && !onboardingComplete && (
          <OnboardingFlow
            onComplete={completeOnboarding}
            userName={user?.name?.split(' ')[0]}
          />
        )}
      </AnimatePresence>

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="planner" element={<PlannerPage />} />
          <Route path="ai-assistant" element={<AIAssistantPage />} />
          <Route path="aws-hub" element={<AWSHubPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
