import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle } from '@/components/ui';
import { cn } from '@/lib/utils';

interface ProductivityScoreProps {
  score: number;
  label?: string;
}

export function ProductivityScore({ score, label = 'AI Productivity Score' }: ProductivityScoreProps) {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getScoreColor = () => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-primary-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreStroke = () => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#3b82f6';
    if (score >= 40) return '#eab308';
    return '#ef4444';
  };

  const getScoreLabel = () => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <Card className="flex flex-col items-center py-6">
      <CardHeader className="text-center">
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <div className="relative w-32 h-32">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-surface-200 dark:text-surface-700"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={getScoreStroke()}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('text-3xl font-bold', getScoreColor())}>{score}</span>
          <span className="text-[10px] text-surface-500 uppercase tracking-wider">/100</span>
        </div>
      </div>
      <p className={cn('text-sm font-medium mt-3', getScoreColor())}>{getScoreLabel()}</p>
    </Card>
  );
}
