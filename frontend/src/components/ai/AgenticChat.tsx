import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PaperAirplaneIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { Button, Spinner, Badge } from '@/components/ui';
import { aiService } from '@/services/api';
import { cn, generateId } from '@/lib/utils';
import type { AgentType } from '@/types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  agentType?: string;
  isLoading?: boolean;
}

const AGENT_OPTIONS = [
  { value: 'productivity_coach' as AgentType, label: 'Coach', icon: '🎯', description: 'Productivity coaching and priorities' },
  { value: 'planning' as AgentType, label: 'Planner', icon: '📅', description: 'Daily schedule generation' },
  { value: 'breakdown' as AgentType, label: 'Breakdown', icon: '🔨', description: 'Task decomposition' },
  { value: 'review' as AgentType, label: 'Review', icon: '📊', description: 'Productivity summaries' },
  { value: 'motivation' as AgentType, label: 'Motivation', icon: '💪', description: 'Encouragement and support' },
];

export function AgenticChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentType>('productivity_coach');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    const loadingId = generateId();
    setMessages((prev) => [
      ...prev,
      { id: loadingId, role: 'assistant', content: '', timestamp: '', isLoading: true },
    ]);

    try {
      // Use the deployed Bedrock AI Lambda directly
      const response = await aiService.chat(userMessage.content, selectedAgent);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingId
            ? {
                ...msg,
                content: response.message || 'Here are my thoughts on that.',
                agentType: response.agentType || selectedAgent,
                isLoading: false,
                timestamp: new Date().toISOString(),
              }
            : msg
        )
      );
    } catch {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingId
            ? {
                ...msg,
                role: 'assistant',
                content: 'I can help with that! To enable AI responses, ensure Amazon Bedrock Nova Lite is enabled in your AWS account (us-east-1). Go to Bedrock Console → Model access → Enable Nova Lite.',
                isLoading: false,
                timestamp: new Date().toISOString(),
              }
            : msg
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const currentAgent = AGENT_OPTIONS.find((a) => a.value === selectedAgent);

  return (
    <div className="flex flex-col h-full">
      {/* Agent Selector */}
      <div className="flex items-center gap-2 p-4 overflow-x-auto scrollbar-hide border-b border-surface-200 dark:border-surface-700">
        {AGENT_OPTIONS.map((agent) => (
          <button
            key={agent.value}
            onClick={() => setSelectedAgent(agent.value)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all',
              selectedAgent === agent.value
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-700'
                : 'bg-surface-50 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 border border-transparent'
            )}
          >
            <span>{agent.icon}</span>
            <span>{agent.label}</span>
          </button>
        ))}
        <Badge variant="primary" className="ml-auto">Bedrock AI</Badge>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-4xl mb-3">{currentAgent?.icon}</div>
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
              {currentAgent?.label}
            </h3>
            <p className="text-sm text-surface-500 max-w-sm mt-1">
              {currentAgent?.description}
            </p>
            <div className="mt-4 p-3 rounded-xl bg-primary-50 dark:bg-primary-900/10 border border-primary-200 dark:border-primary-800 max-w-sm">
              <p className="text-xs text-primary-700 dark:text-primary-400">
                <SparklesIcon className="inline h-3.5 w-3.5 mr-1" />
                Powered by Amazon Bedrock Nova Lite. Ask anything about your tasks and productivity.
              </p>
            </div>
          </div>
        )}

        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              {message.isLoading ? (
                <div className="bg-surface-100 dark:bg-surface-800 rounded-2xl px-4 py-3 border border-surface-200 dark:border-surface-700">
                  <div className="flex items-center gap-2">
                    <Spinner size="sm" />
                    <span className="text-xs text-surface-500">AI is analyzing...</span>
                  </div>
                </div>
              ) : (
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-3 text-sm',
                    message.role === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700'
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <SparklesIcon className="h-3.5 w-3.5 text-primary-500" />
                      <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                        {currentAgent?.label || 'AI'}
                      </span>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-surface-200 dark:border-surface-700">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask the ${currentAgent?.label}...`}
            className="input-field flex-1"
            disabled={loading}
          />
          <Button type="submit" disabled={!input.trim() || loading} size="icon">
            <PaperAirplaneIcon className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
