import {
  CheckCircleIcon,
  ClockIcon,
  FireIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { getGreeting } from '@/lib/utils';
import { StatsCard, WeeklyChart, ProductivityScore, UpcomingDeadlines, RecentInsights } from '@/components/dashboard';
import { mockTasks, mockMetrics, mockInsights } from '@/services/mockData';

export default function DashboardPage() {
  const { user } = useAuth();

  const stats = [
    {
      title: 'Completed',
      value: mockMetrics.tasksCompleted,
      subtitle: 'This week',
      icon: <CheckCircleIcon className="h-5 w-5" />,
      color: 'green' as const,
      trend: { value: 15, label: 'vs last week' },
    },
    {
      title: 'Pending',
      value: mockMetrics.tasksPending,
      subtitle: 'Active tasks',
      icon: <ClockIcon className="h-5 w-5" />,
      color: 'orange' as const,
    },
    {
      title: 'Streak',
      value: `${mockMetrics.streakDays} days`,
      subtitle: 'Keep it up!',
      icon: <FireIcon className="h-5 w-5" />,
      color: 'pink' as const,
      trend: { value: 2, label: 'days more' },
    },
    {
      title: 'Focus Time',
      value: `${Math.round(mockMetrics.totalFocusMinutes / 60)}h`,
      subtitle: 'This week',
      icon: <SparklesIcon className="h-5 w-5" />,
      color: 'purple' as const,
      trend: { value: 8, label: 'vs last week' },
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
          {getGreeting()}, {user?.name?.split(' ')[0] || 'there'} ✨
        </h1>
        <p className="text-sm text-surface-500 mt-1">
          Here's your productivity overview for today
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatsCard key={stat.title} {...stat} index={index} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <WeeklyChart data={mockMetrics.weeklyData} />
        </div>
        <ProductivityScore score={mockMetrics.aiProductivityScore} />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingDeadlines tasks={mockTasks} />
        <RecentInsights insights={mockInsights} />
      </div>
    </div>
  );
}
