import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PaperAirplaneIcon,
  SparklesIcon,
  ArrowPathIcon,
  ClipboardIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { Button, Spinner } from '@/components/ui';
import { AIThinkingIndicator } from '@/components/animated';
import { SuggestedPrompts } from './SuggestedPrompts';
import { StreamingText } from './StreamingText';
import { AGENT_TYPES } from '@/lib/constants';
import type { AgentMessage, AgentType } from '@/types';
import { cn } from '@/lib/utils';

interface AIChatProps {
  messages: AgentMessage[];
  onSendMessage: (message: string, agentType: AgentType) => void;
  loading?: boolean;
}

const SUGGESTED_PROMPTS: Record<string, string[]> = {
  productivity_coach: [
    'What should I focus on today?',
    'Am I overloaded right now?',
    'How can I be more productive?',
    'Prioritize my tasks for me',
  ],
  planning: [
    'Plan my day for me',
    'I have a meeting at 2pm, plan around it',
    'Create a morning focus routine',
    'Schedule deep work blocks',
  ],
  breakdown: [
    'Break down my biggest task',
    'Make my project more manageable',
    'Create subtasks for the auth system',
  ],
  motivation: [
    'I need some encouragement',
    "I'm feeling overwhelmed",
    'Celebrate my progress',
    'Give me a productivity boost',
  ],
  review: [
    'How was my day?',
    'Weekly productivity summary',
    'What patterns do you see?',
    'Score my productivity',
  ],
};

export function AIChat({ messages, onSendMessage, loading }: AIChatProps) {
  const [input, setInput] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<AgentType>('productivity_coach');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Track newest message for streaming effect
  useEffect(() => {
    if (messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.role === 'assistant') {
        setStreamingId(last.id);
      }
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    onSendMessage(input.trim(), selectedAgent);
    setInput('');
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRegenerate = () => {
    if (messages.length >= 2) {
      const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
      if (lastUserMsg) {
        onSendMessage(lastUserMsg.content, selectedAgent);
      }
    }
  };

  const currentAgent = AGENT_TYPES.find((a) => a.type === selectedAgent);
  const prompts = SUGGESTED_PROMPTS[selectedAgent] || SUGGESTED_PROMPTS.productivity_coach;

  return (
    <div className="flex flex-col h-full">
      {/* Agent Selector */}
      <div className="flex items-center gap-2 p-4 overflow-x-auto scrollbar-hide border-b border-surface-200/50 dark:border-surface-700/50">
        {AGENT_TYPES.map((agent) => (
          <motion.button
            key={agent.type}
            onClick={() => setSelectedAgent(agent.type as AgentType)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'relative flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors',
              selectedAgent === agent.type
                ? 'text-primary-700 dark:text-primary-400'
                : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100'
            )}
          >
            {selectedAgent === agent.type && (
              <motion.div
                layoutId="agent-active"
                className="absolute inset-0 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200/50 dark:border-primary-700/30"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            <span className="relative z-10">{agent.icon}</span>
            <span className="relative z-10">{agent.name}</span>
          </motion.button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full text-center px-4"
          >
            <motion.div
              className="text-5xl mb-4"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              {currentAgent?.icon}
            </motion.div>
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
              {currentAgent?.name}
            </h3>
            <p className="text-sm text-surface-500 max-w-sm mt-1 mb-6">
              {currentAgent?.description}
            </p>

            {/* Suggested prompts */}
            <SuggestedPrompts
              prompts={prompts}
              onSelect={(prompt) => {
                setInput(prompt);
                onSendMessage(prompt, selectedAgent);
              }}
            />
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-3 text-sm group relative',
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-lg shadow-primary-500/20'
                    : 'bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200/80 dark:border-surface-700/80 shadow-sm'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <SparklesIcon className="h-3.5 w-3.5 text-primary-500" />
                    <span className="text-[11px] font-semibold text-primary-600 dark:text-primary-400">
                      AI Assistant
                    </span>
                  </div>
                )}

                {/* Streaming effect for new assistant messages */}
                {message.role === 'assistant' && message.id === streamingId ? (
                  <StreamingText
                    text={message.content}
                    speed={15}
                    onComplete={() => setStreamingId(null)}
                    className="whitespace-pre-wrap"
                  />
                ) : (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}

                {/* Action buttons for assistant messages */}
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-1 mt-2 pt-2 border-t border-surface-100 dark:border-surface-700/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleCopy(message.id, message.content)}
                      className="p-1 rounded-md hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-400 hover:text-surface-600 transition-colors"
                      aria-label="Copy response"
                    >
                      {copiedId === message.id ? (
                        <CheckIcon className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <ClipboardIcon className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      onClick={handleRegenerate}
                      className="p-1 rounded-md hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-400 hover:text-surface-600 transition-colors"
                      aria-label="Regenerate"
                    >
                      <ArrowPathIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* AI thinking indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-white dark:bg-surface-800 rounded-2xl px-4 py-3 border border-surface-200/80 dark:border-surface-700/80 shadow-sm">
              <AIThinkingIndicator variant="brain" message={`${currentAgent?.name} is thinking`} />
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts when chat has messages */}
      {messages.length > 0 && messages.length < 4 && !loading && (
        <div className="px-4 pb-2">
          <SuggestedPrompts
            prompts={prompts.slice(0, 2)}
            onSelect={(prompt) => {
              onSendMessage(prompt, selectedAgent);
            }}
          />
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-surface-200/50 dark:border-surface-700/50 bg-white/50 dark:bg-surface-800/50 backdrop-blur-sm"
      >
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask ${currentAgent?.name}...`}
              className="input-field pr-10"
              disabled={loading}
            />
            {input.trim() && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-surface-100 dark:bg-surface-700 text-surface-400 border border-surface-200 dark:border-surface-600">
                  Enter
                </kbd>
              </motion.div>
            )}
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button type="submit" disabled={!input.trim() || loading} size="icon" className="rounded-xl">
              <PaperAirplaneIcon className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </form>
    </div>
  );
}
