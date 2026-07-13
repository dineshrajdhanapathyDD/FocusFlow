import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { store } from '../store.js';

// ===== AWS Content Types =====
interface AWSArticle {
  id: string;
  title: string;
  url: string;
  category: string;
  date: string;
  summary: string;
  tags: string[];
  source: 'blog' | 'whats_new' | 'announcement' | 'event';
}

interface AWSEvent {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  type: 'webinar' | 'conference' | 'workshop' | 'meetup' | 'online';
  url: string;
  description: string;
  tags: string[];
  free: boolean;
}

// Simulated AWS content feeds (in production, fetch from RSS/APIs)
const AWS_ARTICLES: AWSArticle[] = [
  {
    id: 'art-1',
    title: 'Amazon Bedrock now supports Agents with MCP tool integration',
    url: 'https://aws.amazon.com/blogs/machine-learning/bedrock-mcp-integration',
    category: 'Machine Learning',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    summary: 'Amazon Bedrock agents can now natively connect to MCP servers, enabling tool-use workflows with standardized protocol support.',
    tags: ['bedrock', 'mcp', 'agents', 'ai'],
    source: 'blog',
  },
  {
    id: 'art-2',
    title: 'Introducing Strands Agents SDK for building production AI agents',
    url: 'https://aws.amazon.com/blogs/opensource/introducing-strands-agents',
    category: 'Open Source',
    date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
    summary: 'Strands Agents is an open source SDK that takes a model-driven approach to building AI agents in just a few lines of code.',
    tags: ['strands', 'agents', 'open-source', 'python'],
    source: 'blog',
  },
  {
    id: 'art-3',
    title: 'AWS Lambda now supports Node.js 22 runtime',
    url: 'https://aws.amazon.com/about-aws/whats-new/lambda-nodejs-22',
    category: 'Compute',
    date: new Date(Date.now() - 259200000).toISOString().split('T')[0],
    summary: 'You can now develop AWS Lambda functions using Node.js 22 runtime with improved performance and ESM support.',
    tags: ['lambda', 'nodejs', 'serverless', 'compute'],
    source: 'whats_new',
  },
  {
    id: 'art-4',
    title: 'Amazon DynamoDB zero-ETL integration with Amazon Redshift is now generally available',
    url: 'https://aws.amazon.com/about-aws/whats-new/dynamodb-zero-etl',
    category: 'Database',
    date: new Date(Date.now() - 345600000).toISOString().split('T')[0],
    summary: 'Seamlessly replicate DynamoDB data to Redshift for analytics without building ETL pipelines.',
    tags: ['dynamodb', 'redshift', 'analytics', 'database'],
    source: 'whats_new',
  },
  {
    id: 'art-5',
    title: 'New Amazon Nova models available in Bedrock with enhanced reasoning',
    url: 'https://aws.amazon.com/blogs/aws/nova-enhanced-reasoning',
    category: 'Machine Learning',
    date: new Date(Date.now() - 432000000).toISOString().split('T')[0],
    summary: 'Amazon Nova Pro and Nova Premier now feature improved chain-of-thought reasoning and tool-use capabilities.',
    tags: ['nova', 'bedrock', 'llm', 'reasoning', 'ai'],
    source: 'announcement',
  },
  {
    id: 'art-6',
    title: 'Amazon Q Developer now generates infrastructure as code from natural language',
    url: 'https://aws.amazon.com/blogs/devops/q-developer-iac',
    category: 'Developer Tools',
    date: new Date(Date.now() - 518400000).toISOString().split('T')[0],
    summary: 'Describe your infrastructure needs in plain English and Amazon Q Developer generates CloudFormation or CDK templates.',
    tags: ['q-developer', 'iac', 'cloudformation', 'cdk', 'devtools'],
    source: 'blog',
  },
  {
    id: 'art-7',
    title: 'AWS Cost Optimization Hub now provides automated savings recommendations',
    url: 'https://aws.amazon.com/about-aws/whats-new/cost-optimization-hub',
    category: 'Cloud Financial Management',
    date: new Date(Date.now() - 604800000).toISOString().split('T')[0],
    summary: 'The new Cost Optimization Hub aggregates savings opportunities across AWS services in a single dashboard.',
    tags: ['cost', 'optimization', 'savings', 'finops'],
    source: 'whats_new',
  },
  {
    id: 'art-8',
    title: 'Building production-ready agents with Strands, MCP, and Amazon Bedrock',
    url: 'https://aws.amazon.com/blogs/machine-learning/production-agents-strands-mcp',
    category: 'Machine Learning',
    date: new Date(Date.now() - 691200000).toISOString().split('T')[0],
    summary: 'A comprehensive guide to deploying autonomous AI agents using Strands SDK with MCP tool integration on AWS.',
    tags: ['strands', 'mcp', 'bedrock', 'production', 'agents'],
    source: 'blog',
  },
];

const AWS_EVENTS: AWSEvent[] = [
  {
    id: 'evt-1',
    title: 'AWS re:Invent 2026',
    date: '2026-12-01',
    endDate: '2026-12-05',
    type: 'conference',
    url: 'https://reinvent.awsevents.com/',
    description: 'The largest AWS learning conference with keynotes, breakout sessions, workshops, and labs.',
    tags: ['reinvent', 'conference', 'all-services'],
    free: false,
  },
  {
    id: 'evt-2',
    title: 'Building AI Agents with Strands and MCP - Live Workshop',
    date: '2026-07-22',
    type: 'workshop',
    url: 'https://aws.amazon.com/events/strands-mcp-workshop',
    description: 'Hands-on workshop: Build, test, and deploy AI agents using Strands SDK with MCP tool integration.',
    tags: ['strands', 'mcp', 'agents', 'hands-on'],
    free: true,
  },
  {
    id: 'evt-3',
    title: 'AWS Summit Online - Generative AI Edition',
    date: '2026-07-30',
    type: 'online',
    url: 'https://aws.amazon.com/events/summits/online/genai',
    description: 'Free online event focused on generative AI services, RAG patterns, and agentic workflows.',
    tags: ['summit', 'genai', 'bedrock', 'agents'],
    free: true,
  },
  {
    id: 'evt-4',
    title: 'Serverless Office Hours: Lambda + Bedrock Integration',
    date: '2026-07-17',
    type: 'webinar',
    url: 'https://aws.amazon.com/events/office-hours/serverless-bedrock',
    description: 'Live Q&A on connecting Lambda functions to Bedrock for AI-powered applications.',
    tags: ['lambda', 'bedrock', 'serverless', 'qa'],
    free: true,
  },
  {
    id: 'evt-5',
    title: 'AWS Community Day - Cloud Native Meetup',
    date: '2026-08-10',
    type: 'meetup',
    url: 'https://aws.amazon.com/events/community-day',
    description: 'Community-led event with talks on containers, serverless, and modern application architecture.',
    tags: ['community', 'containers', 'serverless', 'architecture'],
    free: true,
  },
];

const LEARNING_PATHS = [
  { id: 'lp-1', name: 'AI/ML on AWS', services: ['bedrock', 'sagemaker', 'nova', 'strands'], level: 'intermediate' },
  { id: 'lp-2', name: 'Serverless Development', services: ['lambda', 'api-gateway', 'dynamodb', 'step-functions'], level: 'beginner' },
  { id: 'lp-3', name: 'Agentic AI & MCP', services: ['bedrock', 'strands', 'mcp', 'agentcore'], level: 'advanced' },
  { id: 'lp-4', name: 'Cloud Architecture', services: ['vpc', 'ecs', 'rds', 'cloudfront'], level: 'intermediate' },
  { id: 'lp-5', name: 'DevOps & CI/CD', services: ['codepipeline', 'cdk', 'cloudformation', 'q-developer'], level: 'intermediate' },
];

export function registerAWSNewsTools(server: McpServer) {
  // Get latest AWS blog posts and articles
  server.tool(
    'get_aws_articles',
    'Get latest AWS blog posts, What\'s New announcements, and news articles. Filter by category, source type, or tags.',
    {
      category: z.string().optional().describe('Filter by category: Machine Learning, Compute, Database, Developer Tools, etc.'),
      source: z.enum(['blog', 'whats_new', 'announcement', 'event']).optional().describe('Filter by content source'),
      tags: z.array(z.string()).optional().describe('Filter by tags (e.g., ["bedrock", "lambda"])'),
      limit: z.number().default(10).describe('Max number of articles to return'),
    },
    async ({ category, source, tags, limit }) => {
      let articles = [...AWS_ARTICLES];

      if (category) {
        articles = articles.filter((a) => a.category.toLowerCase().includes(category.toLowerCase()));
      }
      if (source) {
        articles = articles.filter((a) => a.source === source);
      }
      if (tags && tags.length > 0) {
        articles = articles.filter((a) => tags.some((tag) => a.tags.includes(tag.toLowerCase())));
      }

      articles = articles.slice(0, limit);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            count: articles.length,
            articles: articles.map((a) => ({
              id: a.id,
              title: a.title,
              category: a.category,
              date: a.date,
              summary: a.summary,
              tags: a.tags,
              source: a.source,
              url: a.url,
            })),
          }, null, 2),
        }],
      };
    }
  );

  // Get upcoming AWS events
  server.tool(
    'get_aws_events',
    'Get upcoming AWS events: conferences, workshops, webinars, meetups, and online summits. Filter by type or free events.',
    {
      type: z.enum(['webinar', 'conference', 'workshop', 'meetup', 'online']).optional().describe('Filter by event type'),
      free_only: z.boolean().default(false).describe('Only show free events'),
      tags: z.array(z.string()).optional().describe('Filter by topic tags'),
    },
    async ({ type, free_only, tags }) => {
      let events = AWS_EVENTS.filter((e) => new Date(e.date) >= new Date());

      if (type) {
        events = events.filter((e) => e.type === type);
      }
      if (free_only) {
        events = events.filter((e) => e.free);
      }
      if (tags && tags.length > 0) {
        events = events.filter((e) => tags.some((tag) => e.tags.includes(tag.toLowerCase())));
      }

      events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            count: events.length,
            events: events.map((e) => ({
              id: e.id,
              title: e.title,
              date: e.date,
              endDate: e.endDate,
              type: e.type,
              description: e.description,
              tags: e.tags,
              free: e.free,
              url: e.url,
            })),
          }, null, 2),
        }],
      };
    }
  );

  // Get AWS learning paths
  server.tool(
    'get_learning_paths',
    'Get recommended AWS learning paths with associated services and difficulty levels.',
    {
      level: z.enum(['beginner', 'intermediate', 'advanced']).optional().describe('Filter by difficulty level'),
      service: z.string().optional().describe('Find paths containing a specific AWS service'),
    },
    async ({ level, service }) => {
      let paths = [...LEARNING_PATHS];

      if (level) {
        paths = paths.filter((p) => p.level === level);
      }
      if (service) {
        paths = paths.filter((p) => p.services.some((s) => s.includes(service.toLowerCase())));
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ paths }, null, 2),
        }],
      };
    }
  );

  // Create a learning task from an AWS article or event
  server.tool(
    'create_learning_task',
    'Create a task in FocusFlow from an AWS article, event, or learning goal. Automatically tagged with AWS and relevant service tags.',
    {
      title: z.string().describe('Learning task title'),
      description: z.string().optional().describe('What to learn or do'),
      source_url: z.string().optional().describe('URL of the article/event'),
      tags: z.array(z.string()).default([]).describe('Tags (AWS services, topics)'),
      estimatedMinutes: z.number().default(30).describe('Estimated time in minutes'),
      dueDate: z.string().optional().describe('Due date (YYYY-MM-DD)'),
      priority: z.enum(['critical', 'high', 'medium', 'low']).default('medium').describe('Priority level'),
    },
    async ({ title, description, source_url, tags, estimatedMinutes, dueDate, priority }) => {
      const fullDescription = [
        description,
        source_url ? `\nSource: ${source_url}` : '',
      ].filter(Boolean).join('');

      const task = store.createTask({
        title,
        description: fullDescription,
        category: 'Learning',
        tags: ['aws', ...tags],
        estimatedMinutes,
        dueDate,
        priority,
      });

      return {
        content: [{
          type: 'text' as const,
          text: `Learning task created:\n- Title: "${task.title}"\n- ID: ${task.id}\n- Category: Learning\n- Tags: ${['aws', ...tags].join(', ')}\n- Est: ${estimatedMinutes} min`,
        }],
      };
    }
  );

  // Get today's AWS digest
  server.tool(
    'get_aws_daily_digest',
    'Get a curated daily digest of the most important AWS news, events, and learning recommendations. Perfect for a morning briefing.',
    {},
    async () => {
      const today = new Date().toISOString().split('T')[0];
      const recentArticles = AWS_ARTICLES.slice(0, 3);
      const upcomingEvents = AWS_EVENTS
        .filter((e) => new Date(e.date) >= new Date())
        .slice(0, 3);

      const existingTasks = store.listTasks(undefined, { category: 'Learning' });
      const awsTasks = existingTasks.filter((t) => t.tags.includes('aws'));
      const pendingLearning = awsTasks.filter((t) => t.status !== 'completed');

      const digest = {
        date: today,
        greeting: `Here's your AWS daily digest for ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`,
        topArticles: recentArticles.map((a) => ({
          title: a.title,
          category: a.category,
          summary: a.summary,
          source: a.source,
        })),
        upcomingEvents: upcomingEvents.map((e) => ({
          title: e.title,
          date: e.date,
          type: e.type,
          free: e.free,
        })),
        learningStatus: {
          pendingTasks: pendingLearning.length,
          topics: [...new Set(pendingLearning.flatMap((t) => t.tags.filter((tag) => tag !== 'aws')))],
        },
        recommendation: pendingLearning.length === 0
          ? 'You have no AWS learning tasks. Consider creating one from today\'s articles!'
          : `You have ${pendingLearning.length} pending AWS learning task(s). Keep the momentum going!`,
      };

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(digest, null, 2),
        }],
      };
    }
  );

  // Search AWS content
  server.tool(
    'search_aws_content',
    'Search across all AWS articles, events, and learning paths by keyword.',
    {
      query: z.string().describe('Search query (e.g., "bedrock agents", "serverless", "cost optimization")'),
    },
    async ({ query }) => {
      const lowerQuery = query.toLowerCase();

      const matchingArticles = AWS_ARTICLES.filter(
        (a) => a.title.toLowerCase().includes(lowerQuery) ||
               a.summary.toLowerCase().includes(lowerQuery) ||
               a.tags.some((t) => t.includes(lowerQuery))
      );

      const matchingEvents = AWS_EVENTS.filter(
        (e) => e.title.toLowerCase().includes(lowerQuery) ||
               e.description.toLowerCase().includes(lowerQuery) ||
               e.tags.some((t) => t.includes(lowerQuery))
      );

      const matchingPaths = LEARNING_PATHS.filter(
        (p) => p.name.toLowerCase().includes(lowerQuery) ||
               p.services.some((s) => s.includes(lowerQuery))
      );

      const totalResults = matchingArticles.length + matchingEvents.length + matchingPaths.length;

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            query,
            totalResults,
            articles: matchingArticles.map((a) => ({ title: a.title, category: a.category, date: a.date, source: a.source })),
            events: matchingEvents.map((e) => ({ title: e.title, date: e.date, type: e.type, free: e.free })),
            learningPaths: matchingPaths.map((p) => ({ name: p.name, level: p.level, services: p.services })),
          }, null, 2),
        }],
      };
    }
  );
}
