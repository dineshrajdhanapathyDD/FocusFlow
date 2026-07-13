import { AnimatedRing } from '@/components/animated';
import { useGamification } from './GamificationContext';
import { getLevelTitle } from './types';
import { cn } from '@/lib/utils';

interface LevelBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  className?: string;
}

const levelColors: Record<string, string> = {
  Beginner: '#94a3b8',
  Productive: '#3b82f6',
  Focused: '#8b5cf6',
  Master: '#f59e0b',
  Grandmaster: '#ef4444',
  Legend: '#ec4899',
};

export function LevelBadge({ size = 'md', showDetails = false, className }: LevelBadgeProps) {
  const { state, levelInfo } = useGamification();
  const title = getLevelTitle(state.level);
  const color = levelColors[title] || '#3b82f6';

  const ringSize = size === 'sm' ? 36 : size === 'md' ? 52 : 80;
  const strokeWidth = size === 'sm' ? 3 : size === 'md' ? 4 : 6;

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <AnimatedRing
        value={levelInfo.progress}
        size={ringSize}
        strokeWidth={strokeWidth}
        color={color}
      >
        <span className={cn(
          'font-bold',
          size === 'sm' && 'text-xs',
          size === 'md' && 'text-sm',
          size === 'lg' && 'text-xl'
        )} style={{ color }}>
          {state.level}
        </span>
      </AnimatedRing>
      {showDetails && (
        <div>
          <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">{title}</p>
          <p className="text-xs text-surface-500">
            {levelInfo.current}/{levelInfo.required} XP to next level
          </p>
        </div>
      )}
    </div>
  );
}
