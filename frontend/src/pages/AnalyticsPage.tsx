import { AnalyticsDashboard } from '@/components/analytics';
import { mockMetrics } from '@/services/mockData';

export default function AnalyticsPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Analytics</h1>
        <p className="text-sm text-surface-500 mt-1">
          Track your productivity trends and performance
        </p>
      </div>
      <AnalyticsDashboard metrics={mockMetrics} />
    </div>
  );
}
