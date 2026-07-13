import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Card, CardHeader, CardTitle } from '@/components/ui';
import type { WeeklyData } from '@/types';

interface WeeklyChartProps {
  data: WeeklyData[];
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Productivity</CardTitle>
      </CardHeader>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 12 }}
              className="text-surface-500"
            />
            <YAxis tick={{ fontSize: 12 }} className="text-surface-500" />
            <Tooltip
              contentStyle={{
                borderRadius: '12px',
                border: 'none',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
              }}
            />
            <Bar dataKey="completed" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Completed" />
            <Bar dataKey="created" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Created" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
