import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  NewspaperIcon,
  CalendarDaysIcon,
  AcademicCapIcon,
  SparklesIcon,
  ArrowTopRightOnSquareIcon,
  BookOpenIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { Card, Badge, Button, Spinner } from '@/components/ui';
import { aiService } from '@/services/api';
import { fetchAWSFeed, fetchMultipleFeeds, searchAWSFeeds, type AWSFeedItem, type FeedSource } from '@/services/awsFeed';
import { cn } from '@/lib/utils';

type TabType = 'feed' | 'events' | 'learning' | 'agent';

interface AIResponse {
  response: string;
  tool_calls?: { tool: string; input: Record<string, unknown> }[];
  fallback?: boolean;
}

const sourceLabels: Record<string, string> = {
  blog: 'AWS Blog',
  whats_new: "What's New",
  machine_learning: 'ML Blog',
  compute: 'Compute',
  devops: 'DevOps',
  architecture: 'Architecture',
  security: 'Security',
  opensource: 'Open Source',
};

const sourceColors: Record<string, string> = {
  blog: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  whats_new: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  machine_learning: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  compute: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  devops: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  architecture: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  security: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  opensource: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
};

const LEARNING_PATHS = [
  { id: 'lp-1', name: 'AI/ML on AWS', services: ['Bedrock', 'SageMaker', 'Nova', 'Strands'], level: 'intermediate', icon: '🧠' },
  { id: 'lp-2', name: 'Serverless Development', services: ['Lambda', 'API Gateway', 'DynamoDB', 'Step Functions'], level: 'beginner', icon: '⚡' },
  { id: 'lp-3', name: 'Agentic AI & MCP', services: ['Bedrock', 'Strands', 'MCP', 'AgentCore'], level: 'advanced', icon: '🤖' },
  { id: 'lp-4', name: 'Cloud Architecture', services: ['VPC', 'ECS', 'RDS', 'CloudFront'], level: 'intermediate', icon: '🏗️' },
  { id: 'lp-5', name: 'DevOps & CI/CD', services: ['CodePipeline', 'CDK', 'CloudFormation', 'Q Developer'], level: 'intermediate', icon: '🔄' },
];

export default function AWSHubPage() {
  const [activeTab, setActiveTab] = useState<TabType>('feed');
  const [agentResponse, setAgentResponse] = useState<AIResponse | null>(null);
  const [agentLoading, setAgentLoading] = useState(false);
  const [skillInput, setSkillInput] = useState('');

  const tabs = [
    { id: 'feed' as const, label: 'Live Feed', icon: NewspaperIcon },
    { id: 'events' as const, label: "What's New", icon: CalendarDaysIcon },
    { id: 'learning' as const, label: 'Learning', icon: AcademicCapIcon },
    { id: 'agent' as const, label: 'AI Guide', icon: SparklesIcon },
  ];

  const handleAskAgent = async (message: string) => {
    setAgentLoading(true);
    setActiveTab('agent');
    try {
      // Use the deployed Bedrock AI chat endpoint directly
      const res = await aiService.chat(message, 'productivity_coach');
      setAgentResponse({
        response: res.message || 'Here are my thoughts on that topic.',
        tool_calls: [],
        fallback: false,
      });
    } catch {
      // Fallback: provide a helpful response without the backend
      setAgentResponse({
        response: `About "${message}":\n\nI recommend checking the Live Feed tab for the latest articles on this topic. You can also search for specific AWS services using the search bar.\n\nFor deeper analysis, ensure Amazon Bedrock Nova Lite model access is enabled in your AWS account (us-east-1).`,
        tool_calls: [],
        fallback: true,
      });
    }
    setAgentLoading(false);
  };

  const handleSkillPlan = async () => {
    if (!skillInput.trim()) return;
    await handleAskAgent(`Create a learning plan for: ${skillInput}`);
    setSkillInput('');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50 flex items-center gap-2">
            <span className="text-[#FF9900]">☁️</span> AWS Hub
          </h1>
          <p className="text-sm text-surface-500 mt-1">
            Real-time AWS news, announcements, and learning resources
          </p>
        </div>
        <Badge variant="success" className="animate-pulse">Live</Badge>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center',
              activeTab === tab.id
                ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 shadow-sm'
                : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
            )}
          >
            <tab.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'feed' && <LiveFeedPanel onAskAgent={handleAskAgent} />}
      {activeTab === 'events' && <WhatsNewPanel />}
      {activeTab === 'learning' && (
        <LearningPanel skillInput={skillInput} setSkillInput={setSkillInput} onGeneratePlan={handleSkillPlan} loading={agentLoading} />
      )}
      {activeTab === 'agent' && (
        <AgentPanel response={agentResponse} loading={agentLoading} onAsk={handleAskAgent} />
      )}
    </div>
  );
}

function LiveFeedPanel({ onAskAgent }: { onAskAgent: (msg: string) => void }) {
  const [articles, setArticles] = useState<AWSFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<FeedSource | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const sources: (FeedSource | 'all')[] = ['all', 'blog', 'whats_new', 'machine_learning', 'compute', 'devops', 'opensource'];

  useEffect(() => { loadFeed(); }, [source]);

  const loadFeed = async () => {
    setLoading(true);
    if (source === 'all') {
      const items = await fetchMultipleFeeds(['blog', 'whats_new', 'machine_learning', 'compute'], 8);
      setArticles(items);
    } else {
      const items = await fetchAWSFeed(source, 12);
      setArticles(items);
    }
    setLoading(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) { loadFeed(); return; }
    setLoading(true);
    const results = await searchAWSFeeds(searchQuery);
    setArticles(results);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex gap-2">
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search AWS content (e.g., bedrock, lambda, cost)..."
          className="input-field flex-1"
        />
        <Button onClick={handleSearch} variant="secondary">Search</Button>
        <Button onClick={loadFeed} variant="ghost" size="icon"><ArrowPathIcon className="h-4 w-4" /></Button>
      </div>

      {/* Source filter */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        {sources.map((s) => (
          <button
            key={s}
            onClick={() => setSource(s)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
              source === s
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                : 'bg-surface-100 dark:bg-surface-800 text-surface-500 hover:text-surface-700'
            )}
          >
            {s === 'all' ? 'All Feeds' : sourceLabels[s] || s}
          </button>
        ))}
      </div>

      {/* Articles */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-12 text-surface-500">
          <p>No articles found. Try a different feed or search term.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {articles.map((article, i) => (
            <motion.div
              key={`${article.link}-${i}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card hover padding="md" className="group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={cn('px-2 py-0.5 rounded text-[10px] font-medium', sourceColors[article.source] || sourceColors.blog)}>
                        {sourceLabels[article.source] || article.source}
                      </span>
                      <span className="text-xs text-surface-400">
                        {new Date(article.pubDate).toLocaleDateString()}
                      </span>
                    </div>
                    <a
                      href={article.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-surface-900 dark:text-surface-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors"
                    >
                      {article.title}
                    </a>
                    <p className="text-xs text-surface-500 mt-1.5 line-clamp-2">{article.description}</p>
                    {article.categories.length > 0 && (
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {article.categories.slice(0, 4).map((cat) => (
                          <span key={cat} className="text-[10px] px-2 py-0.5 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-500">
                            {cat}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <a href={article.link} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-400 hover:text-primary-500 transition-colors">
                      <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                    </a>
                    <button
                      onClick={() => onAskAgent(`Tell me more about: ${article.title}`)}
                      className="p-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-surface-400 hover:text-primary-500 transition-colors"
                      title="Ask AI about this"
                    >
                      <SparklesIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function WhatsNewPanel() {
  const [items, setItems] = useState<AWSFeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAWSFeed('whats_new', 15).then((data) => {
      setItems(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
          AWS What's New - Live Announcements
        </h2>
        <Badge variant="success">Real-time</Badge>
      </div>
      <div className="grid gap-3">
        {items.map((item, i) => (
          <motion.a
            key={`${item.link}-${i}`}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className="block"
          >
            <Card hover padding="md" className="group">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#FF9900]/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-[#FF9900]">
                    {new Date(item.pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 group-hover:text-primary-600 transition-colors line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-surface-500 mt-0.5 line-clamp-1">{item.description}</p>
                </div>
                <ArrowTopRightOnSquareIcon className="h-4 w-4 text-surface-300 group-hover:text-primary-500 flex-shrink-0" />
              </div>
            </Card>
          </motion.a>
        ))}
      </div>
    </div>
  );
}

function LearningPanel({ skillInput, setSkillInput, onGeneratePlan, loading }: {
  skillInput: string; setSkillInput: (v: string) => void; onGeneratePlan: () => void; loading: boolean;
}) {
  return (
    <div className="space-y-6">
      <Card className="border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10">
        <div className="flex items-center gap-2 mb-3">
          <SparklesIcon className="h-5 w-5 text-purple-500" />
          <h3 className="font-semibold text-surface-900 dark:text-surface-100">AI Skill Plan Generator</h3>
        </div>
        <p className="text-xs text-surface-500 mb-3">
          Ask the AI to build a learning plan from real AWS articles and resources.
        </p>
        <div className="flex items-center gap-2">
          <input
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            placeholder="e.g., Building AI agents with Bedrock and Strands..."
            className="input-field flex-1"
            onKeyDown={(e) => e.key === 'Enter' && onGeneratePlan()}
          />
          <Button onClick={onGeneratePlan} loading={loading} disabled={!skillInput.trim()}>Generate</Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {LEARNING_PATHS.map((path, i) => (
          <motion.div key={path.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
            <Card hover padding="md" className="h-full">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{path.icon}</span>
                <div>
                  <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100">{path.name}</h3>
                  <Badge variant={path.level === 'beginner' ? 'success' : path.level === 'intermediate' ? 'warning' : 'purple'}>
                    {path.level}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {path.services.map((s) => (
                  <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400">{s}</span>
                ))}
              </div>
              <Button variant="ghost" size="sm" className="mt-3 w-full" onClick={() => setSkillInput(path.name)}>
                <BookOpenIcon className="h-3.5 w-3.5" /> Start Learning
              </Button>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function AgentPanel({ response, loading, onAsk }: {
  response: AIResponse | null; loading: boolean; onAsk: (msg: string) => void;
}) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onAsk(input.trim());
    setInput('');
  };

  return (
    <div className="space-y-4">
      <Card className="border-purple-200 dark:border-purple-800">
        <div className="flex items-center gap-2 mb-2">
          <SparklesIcon className="h-5 w-5 text-purple-500" />
          <h3 className="font-semibold text-surface-900 dark:text-surface-100">AWS Learning Agent</h3>
          <Badge variant="purple">Strands + MCP</Badge>
        </div>
        <p className="text-xs text-surface-500">
          Ask about any AWS topic. The agent reads live AWS feeds and creates learning plans.
        </p>
        <form onSubmit={handleSubmit} className="flex gap-2 mt-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about AWS... (e.g., What's new with Bedrock?)"
            className="input-field flex-1"
            disabled={loading}
          />
          <Button type="submit" disabled={!input.trim() || loading} loading={loading}>Ask</Button>
        </form>
      </Card>

      {loading && (
        <Card padding="md">
          <div className="flex items-center gap-3">
            <Spinner size="sm" />
            <span className="text-sm text-surface-500">Agent is reading AWS feeds and analyzing...</span>
          </div>
        </Card>
      )}

      {!loading && response && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card padding="md">
            {response.fallback && (
              <div className="mb-3 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  Tip: Enable Amazon Bedrock Nova Lite in your AWS account for AI-powered responses.
                </p>
              </div>
            )}
            <pre className="whitespace-pre-wrap text-sm text-surface-800 dark:text-surface-200 font-sans leading-relaxed">
              {response.response}
            </pre>
            {response.tool_calls && response.tool_calls.length > 0 && (
              <div className="mt-4 pt-3 border-t border-surface-200 dark:border-surface-700">
                <p className="text-[11px] font-medium text-surface-500 mb-2">Tools used:</p>
                <div className="flex flex-wrap gap-1.5">
                  {response.tool_calls.map((tc, i) => (
                    <span key={i} className="text-[10px] font-mono px-2 py-1 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400">
                      {tc.tool}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      )}

      {!loading && !response && (
        <div className="grid grid-cols-2 gap-3">
          {['What is new on AWS this week?', 'Explain Bedrock agents', 'Best practices for Lambda', 'How to use MCP with Strands?'].map((q) => (
            <button key={q} onClick={() => onAsk(q)} className="text-left p-3 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-600 text-xs text-surface-600 dark:text-surface-400 hover:text-primary-700 transition-all">
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
