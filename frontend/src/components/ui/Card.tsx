import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, glass = false, hover = false, padding = 'md', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl border',
          glass
            ? 'bg-white/80 dark:bg-surface-800/80 backdrop-blur-xl border-surface-200/50 dark:border-surface-700/50'
            : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700',
          hover && 'hover:shadow-md transition-shadow duration-200',
          padding === 'sm' && 'p-3',
          padding === 'md' && 'p-5',
          padding === 'lg' && 'p-7',
          padding === 'none' && '',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

function CardHeader({ className, ...props }: CardHeaderProps) {
  return <div className={cn('mb-4', className)} {...props} />;
}

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

function CardTitle({ className, ...props }: CardTitleProps) {
  return <h3 className={cn('text-lg font-semibold text-surface-900 dark:text-surface-50', className)} {...props} />;
}

interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}

function CardDescription({ className, ...props }: CardDescriptionProps) {
  return <p className={cn('text-sm text-surface-500 dark:text-surface-400 mt-1', className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardDescription };
