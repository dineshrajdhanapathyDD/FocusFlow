import { useState } from 'react';
import { AIChat } from '@/components/ai';
import { AgenticChat } from '@/components/ai/AgenticChat';
import { Card } from '@/components/ui';
import type { AgentMessage, AgentType } from '@/types';
import { generateId } from '@/lib/utils';
import { agentService } from '@/services/api';

const mockResponses: Record<AgentType, string[]> = {
  productivity_coach: [
    "Based on your current workload, I recommend prioritizing the authentication system task first. It's marked as critical and due tomorrow. After that, focus on the landing page design since you already have momentum with 45% progress.",
    "I notice you have 12 pending tasks. To avoid overwhelm, I suggest using the 2-minute rule: if a task takes less than 2 minutes, do it now. This could clear 3-4 items from your list immediately.",
  ],
  planning: [
    "Here's your optimized schedule for today:\n\n9:00-10:30 - Deep Work: Authentication System\n10:30-10:45 - Break\n10:45-12:00 - Landing Page Design\n12:00-13:00 - Lunch\n13:00-15:00 - API Documentation\n15:00-16:00 - Reading: TS Patterns\n16:00-17:00 - Wrap-up",
  ],
  breakdown: [
    "I've broken down 'Implement authentication system' into actionable subtasks:\n\n1. Set up Cognito User Pool (30 min)\n2. Configure JWT token validation (45 min)\n3. Create login/register Lambda handlers (60 min)\n4. Implement password reset flow (45 min)\n5. Add protected route middleware (30 min)\n6. Write integration tests (30 min)\n\nTotal estimated time: 4 hours",
  ],
  motivation: [
    "You've completed 28 tasks this week - that's 30% more than last week! Your consistency is building real momentum. Keep that streak going!",
  ],
  review: [
    "Daily Summary:\n\n Completed: 5 tasks\n Focus time: 4.5 hours\n Completion rate: 83%\n\nHighlights:\n- Made strong progress on the landing page\n- Cleared all admin tasks\n\nTomorrow's priority: Start with authentication system.",
  ],
};

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [agenticMode, setAgenticMode] = useState(false);

  const handleSendMessage = async (content: string, agentType: AgentType) => {
    const userMessage: AgentMessage = {
      id: generateId(),
      agentType,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    // Simulate AI response for non-agentic mode
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const responses = mockResponses[agentType];
    const responseContent = responses[Math.floor(Math.random() * responses.length)];

    const assistantMessage: AgentMessage = {
      id: generateId(),
      agentType,
      role: 'assistant',
      content: responseContent,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">AI Assistant</h1>
          <p className="text-sm text-surface-500 mt-1">
            {agenticMode
              ? 'Agentic mode: AI uses MCP tools autonomously to help you'
              : 'Chat with specialized AI agents'}
          </p>
        </div>
        {/* Agentic mode toggle */}
        <button
          onClick={() => setAgenticMode(!agenticMode)}
          className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            agenticMode
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-700'
              : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 border border-surface-200 dark:border-surface-700'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${agenticMode ? 'bg-purple-500 animate-pulse' : 'bg-surface-400'}`} />
          {agenticMode ? 'Agentic Mode' : 'Standard Mode'}
        </button>
      </div>

      <Card padding="none" className="h-[calc(100%-4rem)] overflow-hidden">
        {agenticMode ? (
          <AgenticChat />
        ) : (
          <AIChat messages={messages} onSendMessage={handleSendMessage} loading={loading} />
        )}
      </Card>
    </div>
  );
}
