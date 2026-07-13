import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PaperAirplaneIcon,
  SparklesIcon,
  WrenchScrewdriverIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { Button, Spinner, Badge } from '@/components/ui';
import { agentService, type AgenticResponse } from '@/services/api';
import { cn, generateId } from '@/lib/utils';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  agentType?: string;
  toolCalls?: { tool: string; input: Record<string, unknown> }[];
  isLoading?: boolean;
  fallback?: boolean;
}

const AGENT_OPTIONS = [
  { value: 'orchestrator', label: 'Orchestrator', icon: '🤖', description: 'General purpose - handles any request' },
  { value: 'coach', label: 'Coach', icon: '🎯', description: 'Productivity coaching and priorities' },
  { value: 'planner', label: 'Planner', icon: '📅', description: 'Daily schedule generation' },
  { value: 'breakdown', label: 'Breakdown', icon: '🔨', description: 'Task decomposition' },
  { value: 'review', label: 'Review', icon: '📊', description: 'Productivity summaries' },
];

export function AgenticChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('orchestrator');
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

    // Add placeholder loading message
    const loadingId = generateId();
    setMessages((prev) => [
      ...prev,
      { id: loadingId, role: 'assistant', content: '', timestamp: '', isLoading: true },
    ]);

    try {
      let response: AgenticResponse;

      switch (selectedAgent) {
        case 'coach':
          response = await agentService.coach(userMessage.content);
          break;
        case 'planner':
          response = await agentService.plan(undefined, userMessage.content);
          break;
        case 'review':
          response = await agentService.review();
          break;
        default:
          response = await agentService.chat(userMessage.content, selectedAgent);
      }

      // Replace loading message with real response
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingId
            ? {
                ...msg,
                content: response.response,
                agentType: response.agent_type,
                toolCalls: response.tool_calls,
                isLoading: false,
                fallback: response.fallback,
                timestamp: new Date().toISOString(),
              }
            : msg
        )
      );
    } catch (error) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingId
            ? {
                ...msg,
                role: 'system',
                content: 'Failed to reach the agent service. Make sure the Strands agent server is running (cd agents && python -m src.server).',
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
        <Badge variant="purple" className="ml-auto">MCP + Strands</Badge>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-4xl mb-3">{currentAgent?.icon}</div>
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
              {currentAgent?.label} Agent
            </h3>
            <p className="text-sm text-surface-500 max-w-sm mt-1">
              {currentAgent?.description}
            </p>
            <div className="mt-4 p-3 rounded-xl bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 max-w-sm">
              <p className="text-xs text-purple-700 dark:text-purple-400">
                <SparklesIcon className="inline h-3.5 w-3.5 mr-1" />
                <strong>Agentic Mode:</strong> This agent uses MCP tools autonomously. It will read your tasks, analyze workload, and take actions — showing you each tool it calls.
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
                    <span className="text-xs text-surface-500">Agent is reasoning and using tools...</span>
                  </div>
                </div>
              ) : (
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-3 text-sm',
                    message.role === 'user'
                      ? 'bg-primary-600 text-white'
                      : message.role === 'system'
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                      : 'bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700'
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <SparklesIcon className="h-3.5 w-3.5 text-purple-500" />
                      <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                        {message.agentType || selectedAgent} agent
                      </span>
                      {message.fallback && (
                        <Badge variant="warning" className="ml-1 text-[10px]">offline</Badge>
                      )}
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{message.content}</p>

                  {/* Tool calls transparency */}
                  {message.toolCalls && message.toolCalls.length > 0 && (
                    <ToolCallsPanel toolCalls={message.toolCalls} />
                  )}
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
            placeholder={`Ask the ${currentAgent?.label} agent...`}
            className="input-field flex-1"
            disabled={loading}
          />
          <Button type="submit" disabled={!input.trim() || loading} size="icon">
            <PaperAirplaneIcon className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[10px] text-surface-400 mt-1.5 text-center">
          Agent calls tools via MCP protocol. Ensure the agent server is running for live responses.
        </p>
      </form>
    </div>
  );
}

function ToolCallsPanel({ toolCalls }: { toolCalls: { tool: string; input: Record<string, unknown> }[] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-3 pt-2 border-t border-surface-200/50 dark:border-surface-600/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-[11px] font-medium text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 transition-colors"
      >
        <WrenchScrewdriverIcon className="h-3.5 w-3.5" />
        {toolCalls.length} tool call{toolCalls.length !== 1 ? 's' : ''} used
        {expanded ? (
          <ChevronDownIcon className="h-3 w-3" />
        ) : (
          <ChevronRightIcon className="h-3 w-3" />
        )}
      </button>

      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="mt-2 space-y-1.5"
        >
          {toolCalls.map((tc, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-[11px] p-2 rounded-lg bg-surface-50 dark:bg-surface-900/50"
            >
              <span className="text-purple-500 font-mono font-medium whitespace-nowrap">
                {tc.tool}
              </span>
              {Object.keys(tc.input).length > 0 && (
                <span className="text-surface-500 truncate font-mono">
                  ({Object.entries(tc.input).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(', ')})
                </span>
              )}
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
