import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { AnimatedButton } from '@/components/animated';
import { cn } from '@/lib/utils';

interface OnboardingFlowProps {
  onComplete: () => void;
  userName?: string;
}

const STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to FocusFlow',
    subtitle: 'Your AI-powered productivity companion',
    icon: '✨',
    content: 'FocusFlow uses AI to help you prioritize, plan your day, and stay focused on what matters most.',
  },
  {
    id: 'tasks',
    title: 'Smart Task Management',
    subtitle: 'Organize everything in one place',
    icon: '📋',
    content: 'Create tasks with priorities, categories, and deadlines. AI helps you decide what to work on next.',
  },
  {
    id: 'ai',
    title: 'Meet Your AI Agents',
    subtitle: '5 specialized assistants at your service',
    icon: '🤖',
    content: 'Coach for priorities, Planner for schedules, Breakdown for complex tasks, Review for daily summaries, and an AWS Learning agent.',
  },
  {
    id: 'planner',
    title: 'AI Daily Planner',
    subtitle: 'Optimized schedules in seconds',
    icon: '📅',
    content: 'Tell the AI your energy pattern and work hours. It generates a time-blocked schedule based on your priorities.',
  },
  {
    id: 'gamification',
    title: 'Level Up Your Productivity',
    subtitle: 'XP, streaks, and achievements',
    icon: '🏆',
    content: 'Earn XP for completing tasks, maintain streaks, unlock achievements, and track your progress visually.',
  },
  {
    id: 'ready',
    title: "You're All Set!",
    subtitle: 'Let\'s build something great',
    icon: '🚀',
    content: 'Your workspace is ready. Start by creating your first task or ask the AI for guidance.',
  },
];

export function OnboardingFlow({ onComplete, userName }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;

  const next = () => {
    if (isLast) {
      onComplete();
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  const skip = () => onComplete();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-purple-50 dark:from-surface-950 dark:via-surface-900 dark:to-surface-950 p-4"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-20 w-72 h-72 rounded-full bg-primary-200/30 dark:bg-primary-900/20 blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-purple-200/30 dark:bg-purple-900/20 blur-3xl"
          animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((_, i) => (
            <motion.div
              key={i}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                i === currentStep ? 'w-8 bg-primary-500' : i < currentStep ? 'w-2 bg-primary-300' : 'w-2 bg-surface-200 dark:bg-surface-700'
              )}
              layoutId={`step-${i}`}
            />
          ))}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="bg-white/80 dark:bg-surface-800/80 backdrop-blur-xl rounded-3xl border border-surface-200/50 dark:border-surface-700/50 p-8 shadow-xl text-center"
          >
            {/* Icon */}
            <motion.div
              className="text-6xl mb-6"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              {step.icon}
            </motion.div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50 mb-2">
              {currentStep === 0 && userName ? `Welcome, ${userName}!` : step.title}
            </h1>
            <p className="text-sm text-primary-600 dark:text-primary-400 font-medium mb-4">
              {step.subtitle}
            </p>

            {/* Content */}
            <p className="text-surface-600 dark:text-surface-400 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
              {step.content}
            </p>

            {/* Feature preview for specific steps */}
            {step.id === 'ai' && (
              <div className="flex justify-center gap-2 mb-8 flex-wrap">
                {['🎯 Coach', '📅 Planner', '🔨 Breakdown', '📊 Review', '☁️ AWS'].map((agent) => (
                  <motion.span
                    key={agent}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + Math.random() * 0.3 }}
                    className="text-xs px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border border-primary-200/50 dark:border-primary-700/30"
                  >
                    {agent}
                  </motion.span>
                ))}
              </div>
            )}

            {step.id === 'gamification' && (
              <div className="flex justify-center items-center gap-4 mb-8">
                <motion.div
                  className="text-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="text-2xl mb-1">⚡</div>
                  <div className="text-xs text-surface-500">XP Points</div>
                </motion.div>
                <motion.div
                  className="text-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="text-2xl mb-1">🔥</div>
                  <div className="text-xs text-surface-500">Streaks</div>
                </motion.div>
                <motion.div
                  className="text-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="text-2xl mb-1">🏆</div>
                  <div className="text-xs text-surface-500">Achievements</div>
                </motion.div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-center gap-3">
              {!isLast && (
                <button
                  onClick={skip}
                  className="text-sm text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
                >
                  Skip
                </button>
              )}
              <AnimatedButton variant={isLast ? 'glow' : 'primary'} size="lg" onClick={next}>
                {isLast ? (
                  <>
                    <SparklesIcon className="h-4 w-4" />
                    Get Started
                  </>
                ) : (
                  'Continue'
                )}
              </AnimatedButton>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Step counter */}
        <p className="text-center text-xs text-surface-400 mt-4">
          {currentStep + 1} of {STEPS.length}
        </p>
      </div>
    </motion.div>
  );
}
