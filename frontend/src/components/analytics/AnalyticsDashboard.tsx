import { motion } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui';
import type { ProductivityMetrics } from '@/types';

interface AnalyticsDashboardProps {
  metrics: ProductivityMetrics;
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export function AnalyticsDashboard({ metrics }: AnalyticsDashboardProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Weekly Productivity Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Focus Time Trend</CardTitle>
          <CardDescription>Minutes of focused work per day</CardDescription>
        </CardHeader>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metrics.weeklyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
              />
              <Line
                type="monotone"
                dataKey="focusMinutes"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
                name="Focus Minutes"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
          <CardDescription>Tasks by category</CardDescription>
        </CardHeader>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={metrics.categoryBreakdown}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="count"
                nameKey="category"
              >
                {metrics.categoryBreakdown.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Tasks Created vs Completed */}
      <Card>
        <CardHeader>
          <CardTitle>Tasks Created vs Completed</CardTitle>
          <CardDescription>Daily task activity</CardDescription>
        </CardHeader>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics.weeklyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="completed" fill="#22c55e" radius={[4, 4, 0, 0]} name="Completed" />
              <Bar dataKey="created" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Created" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Key Metrics Cards */}
      <Card>
        <CardHeader>
          <CardTitle>Key Metrics</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-2 gap-4">
          <MetricTile label="Streak" value={`${metrics.streakDays} days`} color="text-orange-500" />
          <MetricTile label="Avg Completion" value={`${metrics.averageCompletionTime}m`} color="text-primary-500" />
          <MetricTile label="Completion Rate" value={`${metrics.completionRate}%`} color="text-green-500" />
          <MetricTile label="Focus Total" value={`${Math.round(metrics.totalFocusMinutes / 60)}h`} color="text-purple-500" />
        </div>
      </Card>
    </div>
  );
}

function MetricTile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 rounded-xl bg-surface-50 dark:bg-surface-900 text-center"
    >
      <p className="text-xs text-surface-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </motion.div>
  );
}
