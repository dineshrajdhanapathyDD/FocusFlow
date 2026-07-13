import { SparklesIcon, LightBulbIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Card, CardHeader, CardTitle } from '@/components/ui';
import type { AIInsight } from '@/types';
import { cn } from '@/lib/utils';

interface RecentInsightsProps {
  insights: AIInsight[];
}

const insightIcons: Record<string, React.ReactNode> = {
  suggestion: <LightBulbIcon className="h-5 w-5 text-yellow-500" />,
  burnout_warning: <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />,
  focus_tip: <SparklesIcon className="h-5 w-5 text-purple-500" />,
  motivation: <SparklesIcon className="h-5 w-5 text-green-500" />,
  daily_summary: <SparklesIcon className="h-5 w-5 text-primary-500" />,
  weekly_review: <SparklesIcon className="h-5 w-5 text-indigo-500" />,
};

export function RecentInsights({ insights }: RecentInsightsProps) {
  const recentInsights = insights.slice(0, 4);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-5 w-5 text-primary-500" />
          <CardTitle>AI Insights</CardTitle>
        </div>
      </CardHeader>
      {recentInsights.length === 0 ? (
        <p className="text-sm text-surface-500 text-center py-4">
          Insights will appear as you use the app
        </p>
      ) : (
        <div className="space-y-3">
          {recentInsights.map((insight) => (
            <div
              key={insight.id}
              className="flex items-start gap-3 p-3 rounded-xl bg-surface-50 dark:bg-surface-900/50"
            >
              <div className="flex-shrink-0 mt-0.5">
                {insightIcons[insight.type] || <SparklesIcon className="h-5 w-5 text-primary-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-900 dark:text-surface-100">
                  {insight.title}
                </p>
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5 line-clamp-2">
                  {insight.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
