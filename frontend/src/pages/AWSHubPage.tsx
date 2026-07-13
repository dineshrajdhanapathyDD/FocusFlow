import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  NewspaperIcon,
  CalendarDaysIcon,
  AcademicCapIcon,
  SparklesIcon,
  ArrowTopRightOnSquareIcon,
  BookOpenIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { Card, CardHeader, CardTitle, Badge, Button, Spinner } from '@/components/ui';
import { agentService, type AgenticResponse } from '@/services/api';
import { cn } from '@/lib/utils';

// Mock data matching what the MCP server provides
const MOCK_ARTICLES = [
  { id: 'art-1', title: 'Amazon Bedrock now supports Agents with MCP tool integration', category: 'Machine Learning', date: '2026-07-12', summary: 'Amazon Bedrock agents can now natively connect to MCP servers for tool-use workflows.', tags: ['bedrock', 'mcp', 'agents'], source: 'blog' as const },
  { id: 'art-2', title: 'Introducing Strands Agents SDK for building production AI agents', category: 'Open Source', date: '2026-07-11', summary: 'Open source SDK that takes a model-driven approach to building AI agents in just a few lines of code.', tags: ['strands', 'agents', 'python'], source: 'blog' as const },
  { id: 'art-3', title: 'AWS Lambda now supports Node.js 22 runtime', category: 'Compute', date: '2026-07-10', summary: 'Develop Lambda functions using Node.js 22 with improved performance and ESM support.', tags: ['lambda', 'nodejs', 'serverless'], source: 'whats_new' as const },
  { id: 'art-4', title: 'DynamoDB zero-ETL integration with Redshift now GA', category: 'Database', date: '2026-07-09', summary: 'Seamlessly replicate DynamoDB data to Redshift for analytics without building ETL pipelines.', tags: ['dynamodb', 'redshift', 'analytics'], source: 'whats_new' as const },
  { id: 'art-5', title: 'New Amazon Nova models with enhanced reasoning', category: 'Machine Learning', date: '2026-07-08', summary: 'Nova Pro and Nova Premier now feature improved chain-of-thought reasoning and tool-use.', tags: ['nova', 'bedrock', 'llm'], source: 'announcement' as const },
  { id: 'art-6', title: 'Amazon Q Developer generates IaC from natural language', category: 'Developer Tools', date: '2026-07-07', summary: 'Describe your infrastructure in plain English and Q Developer generates CloudFormation or CDK templates.', tags: ['q-developer', 'iac', 'cdk'], source: 'blog' as const },
];

const MOCK_EVENTS = [
  { id: 'evt-1', title: 'AWS re:Invent 2026', date: '2026-12-01', type: 'conference' as const, free: false, tags: ['reinvent', 'all-services'] },
  { id: 'evt-2', title: 'Building AI Agents with Strands and MCP - Workshop', date: '2026-07-22', type: 'workshop' as const, free: true, tags: ['strands', 'mcp', 'agents'] },
  { id: 'evt-3', title: 'AWS Summit Online - Generative AI Edition', date: '2026-07-30', type: 'online' as const, free: true, tags: ['summit', 'genai'] },
  { id: 'evt-4', title: 'Serverless Office Hours: Lambda + Bedrock', date: '2026-07-17', type: 'webinar' as const, free: true, tags: ['lambda', 'bedrock'] },
  { id: 'evt-5', title: 'AWS Community Day - Cloud Native Meetup', date: '2026-08-10', type: 'meetup' as const, free: true, tags: ['community', 'containers'] },
];

const LEARNING_PATHS = [
  { id: 'lp-1', name: 'AI/ML on AWS', services: ['Bedrock', 'SageMaker', 'Nova', 'Strands'], level: 'intermediate', icon: '🧠' },
  { id: 'lp-2', name: 'Serverless Development', services: ['Lambda', 'API Gateway', 'DynamoDB', 'Step Functions'], level: 'beginner', icon: '⚡' },
  { id: 'lp-3', name: 'Agentic AI & MCP', services: ['Bedrock', 'Strands', 'MCP', 'AgentCore'], level: 'advanced', icon: '🤖' },
  { id: 'lp-4', name: 'Cloud Architecture', services: ['VPC', 'ECS', 'RDS', 'CloudFront'], level: 'intermediate', icon: '🏗️' },
  { id: 'lp-5', name: 'DevOps & CI/CD', services: ['CodePipeline', 'CDK', 'CloudFormation', 'Q Developer'], level: 'intermediate', icon: '🔄' },
];

type TabType = 'feed' | 'events' | 'learning' | 'agent';

const sourceColors: Record<string, string> = {
  blog: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  whats_new: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  announcement: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

const eventTypeColors: Record<string, string> = {
  conference: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  workshop: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  webinar: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  meetup: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  online: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

export default function AWSHubPage() {
  const [activeTab, setActiveTab] = useState<TabType>('feed');
  const [agentResponse, setAgentResponse] = useState<AgenticResponse | null>(null);
  const [agentLoading, setAgentLoading] = useState(false);
  const [skillInput, setSkillInput] = useState('');

  const tabs = [
    { id: 'feed' as const, label: 'News Feed', icon: NewspaperIcon },
    { id: 'events' as const, label: 'Events', icon: CalendarDaysIcon },
    { id: 'learning' as const, label: 'Learning Paths', icon: AcademicCapIcon },
    { id: 'agent' as const, label: 'AI Guide', icon: SparklesIcon },
  ];

  const handleGetDigest = async () => {
    setAgentLoading(true);
    try {
      const res = await agentService.awsDigest(['bedrock', 'lambda', 'strands']);
      setAgentResponse(res);
    } catch {
      setAgentResponse({
        response: 'Agent service not running. Start it with: cd agents && python -m src.server',
        agent_type: 'aws_learning', tool_calls: [], success: false, fallback: true,
      });
    }
    setAgentLoading(false);
  };

  const handleSkillPlan = async () => {
    if (!skillInput.trim()) return;
    setAgentLoading(true);
    try {
      const res = await agentService.awsSkillPlan(skillInput.trim());
      setAgentResponse(res);
    } catch {
      setAgentResponse({
        response: 'Agent service not running. Start it with: cd agents && python -m src.server',
        agent_type: 'aws_learning', tool_calls: [], success: false, fallback: true,
      });
    }
    setAgentLoading(false);
    setSkillInput('');
  };

  const handleGetEvents = async () => {
    setAgentLoading(true);
    try {
      const res = await agentService.awsEvents();
      setAgentResponse(res);
    } catch {
      setAgentResponse({
        response: 'Agent service not running. Start it with: cd agents && python -m src.server',
        agent_type: 'aws_learning', tool_calls: [], success: false, fallback: true,
      });
    }
    setAgentLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50 flex items-center gap-2">
            <span className="text-[#FF9900]">☁️</span> AWS Hub
          </h1>
          <p className="text-sm text-surface-500 mt-1">
            Stay current with AWS news, events, and build your cloud skills
          </p>
        </div>
        <Button onClick={handleGetDigest} loading={agentLoading && activeTab === 'agent'} variant="primary">
          <SparklesIcon className="h-4 w-4" />
          Daily Digest
        </Button>
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

      {/* Tab Content */}
      {activeTab === 'feed' && <NewsFeed />}
      {activeTab === 'events' && <EventsPanel onAskAgent={handleGetEvents} />}
      {activeTab === 'learning' && (
        <LearningPanel
          skillInput={skillInput}
          setSkillInput={setSkillInput}
          onGeneratePlan={handleSkillPlan}
          loading={agentLoading}
        />
      )}
      {activeTab === 'agent' && (
        <AgentPanel response={agentResponse} loading={agentLoading} onGetDigest={handleGetDigest} />
      )}
    </div>
  );
}

function NewsFeed() {
  const [filter, setFilter] = useState<string>('all');

  const filtered = filter === 'all'
    ? MOCK_ARTICLES
    : MOCK_ARTICLES.filter((a) => a.source === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {['all', 'blog', 'whats_new', 'announcement'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              filter === f
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                : 'bg-surface-100 dark:bg-surface-800 text-surface-500 hover:text-surface-700'
            )}
          >
            {f === 'all' ? 'All' : f === 'whats_new' ? "What's New" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {filtered.map((article, i) => (
          <motion.div
            key={article.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card hover padding="md" className="group cursor-pointer">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn('px-2 py-0.5 rounded text-[10px] font-medium', sourceColors[article.source])}>
                      {article.source === 'whats_new' ? "WHAT'S NEW" : article.source.toUpperCase()}
                    </span>
                    <span className="text-xs text-surface-400">{article.date}</span>
                    <Badge variant="outline">{article.category}</Badge>
                  </div>
                  <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-xs text-surface-500 mt-1.5 line-clamp-2">{article.summary}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    {article.tags.map((tag) => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-500">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <ArrowTopRightOnSquareIcon className="h-4 w-4 text-surface-300 group-hover:text-primary-500 transition-colors flex-shrink-0 mt-1" />
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function EventsPanel({ onAskAgent }: { onAskAgent: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">Upcoming AWS Events</h2>
        <Button variant="secondary" size="sm" onClick={onAskAgent}>
          <SparklesIcon className="h-3.5 w-3.5" />
          Ask AI which to attend
        </Button>
      </div>

      <div className="grid gap-3">
        {MOCK_EVENTS.map((event, i) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card hover padding="md">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-[#FF9900]/10 flex flex-col items-center justify-center">
                  <span className="text-xs font-bold text-[#FF9900]">
                    {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                  <span className="text-lg font-bold text-surface-900 dark:text-surface-100">
                    {new Date(event.date).getDate()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100">{event.title}</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={cn('px-2 py-0.5 rounded text-[10px] font-medium', eventTypeColors[event.type])}>
                      {event.type}
                    </span>
                    {event.free && (
                      <Badge variant="success">FREE</Badge>
                    )}
                    <span className="text-xs text-surface-400">
                      {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                </div>
                <Button variant="outline" size="sm">Register</Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function LearningPanel({
  skillInput, setSkillInput, onGeneratePlan, loading,
}: {
  skillInput: string;
  setSkillInput: (v: string) => void;
  onGeneratePlan: () => void;
  loading: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Skill Plan Generator */}
      <Card className="border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10">
        <div className="flex items-center gap-2 mb-3">
          <SparklesIcon className="h-5 w-5 text-purple-500" />
          <h3 className="font-semibold text-surface-900 dark:text-surface-100">AI Skill Plan Generator</h3>
        </div>
        <p className="text-xs text-surface-500 mb-3">
          Tell the AI what AWS skill you want to build and it will create a structured learning plan with tasks, articles, and events.
        </p>
        <div className="flex items-center gap-2">
          <input
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            placeholder="e.g., Building AI agents with Bedrock and Strands..."
            className="input-field flex-1"
            onKeyDown={(e) => e.key === 'Enter' && onGeneratePlan()}
          />
          <Button onClick={onGeneratePlan} loading={loading} disabled={!skillInput.trim()}>
            Generate Plan
          </Button>
        </div>
      </Card>

      {/* Learning Paths Grid */}
      <div>
        <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-4">Learning Paths</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {LEARNING_PATHS.map((path, i) => (
            <motion.div
              key={path.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
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
                  {path.services.map((service) => (
                    <span key={service} className="text-[10px] px-2 py-0.5 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400">
                      {service}
                    </span>
                  ))}
                </div>
                <Button variant="ghost" size="sm" className="mt-3 w-full" onClick={() => { setSkillInput(path.name); }}>
                  <BookOpenIcon className="h-3.5 w-3.5" />
                  Start Learning
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AgentPanel({
  response, loading, onGetDigest,
}: {
  response: AgenticResponse | null;
  loading: boolean;
  onGetDigest: () => void;
}) {
  return (
    <div className="space-y-4">
      <Card className="border-purple-200 dark:border-purple-800">
        <div className="flex items-center gap-2 mb-2">
          <SparklesIcon className="h-5 w-5 text-purple-500" />
          <h3 className="font-semibold text-surface-900 dark:text-surface-100">AWS Learning Agent</h3>
          <Badge variant="purple">Strands + MCP</Badge>
        </div>
        <p className="text-xs text-surface-500">
          This agent autonomously reads AWS news, checks your tasks, and provides personalized learning recommendations using MCP tools.
        </p>
      </Card>

      {loading && (
        <Card padding="md">
          <div className="flex items-center gap-3">
            <Spinner size="sm" />
            <span className="text-sm text-surface-500">Agent is analyzing AWS content and your learning progress...</span>
          </div>
        </Card>
      )}

      {!loading && !response && (
        <Card padding="lg" className="text-center">
          <div className="text-4xl mb-3">🧠</div>
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-1">
            Ready to help you learn
          </h3>
          <p className="text-sm text-surface-500 mb-4 max-w-sm mx-auto">
            Click "Daily Digest" to get personalized AWS news and learning recommendations
          </p>
          <Button onClick={onGetDigest}>
            <SparklesIcon className="h-4 w-4" />
            Get Today's Digest
          </Button>
        </Card>
      )}

      {response && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card padding="md">
            {response.fallback && (
              <div className="mb-3 p-2.5 rounded-lg bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800">
                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                  Agent service offline. Start it: <code className="bg-yellow-100 dark:bg-yellow-900/30 px-1 rounded">cd agents && python -m src.server</code>
                </p>
              </div>
            )}
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-surface-800 dark:text-surface-200 bg-transparent p-0 font-sans">
                {response.response}
              </pre>
            </div>

            {response.tool_calls && response.tool_calls.length > 0 && (
              <div className="mt-4 pt-3 border-t border-surface-200 dark:border-surface-700">
                <p className="text-[11px] font-medium text-surface-500 mb-2">
                  🔧 Tools used by agent ({response.tool_calls.length}):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {response.tool_calls.map((tc, i) => (
                    <span key={i} className="text-[10px] font-mono px-2 py-1 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                      {tc.tool}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      )}
    </div>
  );
}
