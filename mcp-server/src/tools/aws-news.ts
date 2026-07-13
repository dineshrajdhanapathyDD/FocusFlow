import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import Parser from 'rss-parser';
import { store } from '../store.js';

const rssParser = new Parser({
  timeout: 10000,
  headers: { 'User-Agent': 'FocusFlow-MCP/1.0' },
});

// AWS RSS Feed URLs
const AWS_FEEDS = {
  blog: 'https://aws.amazon.com/blogs/aws/feed/',
  whats_new: 'https://aws.amazon.com/about-aws/whats-new/recent/feed/',
  machine_learning: 'https://aws.amazon.com/blogs/machine-learning/feed/',
  compute: 'https://aws.amazon.com/blogs/compute/feed/',
  database: 'https://aws.amazon.com/blogs/database/feed/',
  devops: 'https://aws.amazon.com/blogs/devops/feed/',
  architecture: 'https://aws.amazon.com/blogs/architecture/feed/',
  security: 'https://aws.amazon.com/blogs/security/feed/',
  opensource: 'https://aws.amazon.com/blogs/opensource/feed/',
  serverless: 'https://aws.amazon.com/blogs/compute/feed/',
};

// AWS Events RSS
const AWS_EVENTS_URL = 'https://aws.amazon.com/events/feed/';

interface FeedItem {
  title: string;
  link: string;
  pubDate: string;
  contentSnippet?: string;
  categories?: string[];
}

// Cache to avoid hitting RSS too often
const cache: Map<string, { data: FeedItem[]; timestamp: number }> = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function fetchFeed(url: string): Promise<FeedItem[]> {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const feed = await rssParser.parseURL(url);
    const items: FeedItem[] = (feed.items || []).map((item) => ({
      title: item.title || 'Untitled',
      link: item.link || '',
      pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
      contentSnippet: item.contentSnippet?.slice(0, 200) || item.content?.slice(0, 200) || '',
      categories: item.categories || [],
    }));
    cache.set(url, { data: items, timestamp: Date.now() });
    return items;
  } catch (error) {
    console.error(`Failed to fetch feed ${url}:`, error);
    return cached?.data || [];
  }
}

export function registerAWSNewsTools(server: McpServer) {
  // Get latest AWS blog posts and articles (REAL-TIME from RSS)
  server.tool(
    'get_aws_articles',
    'Fetch latest AWS blog posts and announcements from live RSS feeds. Sources: AWS Blog, What\'s New, Machine Learning, Compute, Database, DevOps, Architecture, Security, Open Source.',
    {
      source: z.enum(['blog', 'whats_new', 'machine_learning', 'compute', 'database', 'devops', 'architecture', 'security', 'opensource']).default('blog').describe('Which AWS feed to fetch'),
      limit: z.number().default(10).describe('Max articles to return'),
    },
    async ({ source, limit }) => {
      const url = AWS_FEEDS[source];
      const items = await fetchFeed(url);
      const articles = items.slice(0, limit);

      if (articles.length === 0) {
        return { content: [{ type: 'text' as const, text: `No articles found from ${source} feed. The feed may be temporarily unavailable.` }] };
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            source,
            count: articles.length,
            fetchedAt: new Date().toISOString(),
            articles: articles.map((a, i) => ({
              rank: i + 1,
              title: a.title,
              url: a.link,
              date: a.pubDate,
              summary: a.contentSnippet,
              tags: a.categories,
            })),
          }, null, 2),
        }],
      };
    }
  );

  // Get What's New announcements (REAL-TIME)
  server.tool(
    'get_aws_whats_new',
    'Fetch the latest AWS What\'s New announcements in real-time. These are official service launches, updates, and new features.',
    {
      limit: z.number().default(10).describe('Number of announcements to fetch'),
    },
    async ({ limit }) => {
      const items = await fetchFeed(AWS_FEEDS.whats_new);
      const announcements = items.slice(0, limit);

      if (announcements.length === 0) {
        return { content: [{ type: 'text' as const, text: 'Unable to fetch What\'s New feed. Try again in a moment.' }] };
      }

      return {
        content: [{
          type: 'text' as const,
          text: `AWS What's New - ${announcements.length} latest announcements:\n\n${announcements.map((a, i) => `${i + 1}. ${a.title}\n   ${new Date(a.pubDate).toLocaleDateString()}\n   ${a.contentSnippet}\n   ${a.link}`).join('\n\n')}`,
        }],
      };
    }
  );

  // Get all AWS news across multiple feeds
  server.tool(
    'get_aws_daily_digest',
    'Fetch a real-time daily digest combining latest posts from AWS Blog, What\'s New, and Machine Learning feeds. Perfect for a morning briefing.',
    {},
    async () => {
      const [blog, whatsNew, ml] = await Promise.all([
        fetchFeed(AWS_FEEDS.blog),
        fetchFeed(AWS_FEEDS.whats_new),
        fetchFeed(AWS_FEEDS.machine_learning),
      ]);

      const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

      // Get existing learning tasks
      const existingTasks = store.listTasks(undefined, { category: 'Learning' });
      const awsTasks = existingTasks.filter((t) => t.tags.includes('aws'));
      const pendingLearning = awsTasks.filter((t) => t.status !== 'completed');

      const digest = {
        date: today,
        fetchedAt: new Date().toISOString(),
        topBlogPosts: blog.slice(0, 3).map((a) => ({
          title: a.title,
          date: new Date(a.pubDate).toLocaleDateString(),
          summary: a.contentSnippet,
          url: a.link,
        })),
        whatsNew: whatsNew.slice(0, 5).map((a) => ({
          title: a.title,
          date: new Date(a.pubDate).toLocaleDateString(),
          url: a.link,
        })),
        mlUpdates: ml.slice(0, 3).map((a) => ({
          title: a.title,
          date: new Date(a.pubDate).toLocaleDateString(),
          summary: a.contentSnippet,
          url: a.link,
        })),
        learningStatus: {
          pendingTasks: pendingLearning.length,
          topics: [...new Set(pendingLearning.flatMap((t) => t.tags.filter((tag) => tag !== 'aws')))],
        },
      };

      return { content: [{ type: 'text' as const, text: JSON.stringify(digest, null, 2) }] };
    }
  );

  // Search across all feeds
  server.tool(
    'search_aws_content',
    'Search for specific topics across all AWS RSS feeds in real-time. Useful for finding articles about specific services or features.',
    {
      query: z.string().describe('Search query (e.g., "bedrock", "lambda layers", "cost optimization")'),
      limit: z.number().default(10).describe('Max results'),
    },
    async ({ query, limit }) => {
      const lowerQuery = query.toLowerCase();

      // Fetch from multiple feeds in parallel
      const [blog, whatsNew, ml, compute, devops] = await Promise.all([
        fetchFeed(AWS_FEEDS.blog),
        fetchFeed(AWS_FEEDS.whats_new),
        fetchFeed(AWS_FEEDS.machine_learning),
        fetchFeed(AWS_FEEDS.compute),
        fetchFeed(AWS_FEEDS.devops),
      ]);

      const allItems = [
        ...blog.map((i) => ({ ...i, source: 'blog' })),
        ...whatsNew.map((i) => ({ ...i, source: 'whats_new' })),
        ...ml.map((i) => ({ ...i, source: 'machine_learning' })),
        ...compute.map((i) => ({ ...i, source: 'compute' })),
        ...devops.map((i) => ({ ...i, source: 'devops' })),
      ];

      const matches = allItems.filter(
        (item) =>
          item.title.toLowerCase().includes(lowerQuery) ||
          (item.contentSnippet || '').toLowerCase().includes(lowerQuery) ||
          (item.categories || []).some((c) => c.toLowerCase().includes(lowerQuery))
      ).slice(0, limit);

      if (matches.length === 0) {
        return { content: [{ type: 'text' as const, text: `No results found for "${query}" in recent AWS feeds. Try a broader search term.` }] };
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            query,
            results: matches.length,
            items: matches.map((m) => ({
              title: m.title,
              source: m.source,
              date: new Date(m.pubDate).toLocaleDateString(),
              summary: m.contentSnippet,
              url: m.link,
            })),
          }, null, 2),
        }],
      };
    }
  );

  // Get AWS events
  server.tool(
    'get_aws_events',
    'Fetch upcoming AWS events from the official events feed.',
    {
      limit: z.number().default(10).describe('Max events to return'),
    },
    async ({ limit }) => {
      try {
        const items = await fetchFeed(AWS_EVENTS_URL);
        const events = items.slice(0, limit);

        if (events.length === 0) {
          return { content: [{ type: 'text' as const, text: 'No events found in the feed. Check https://aws.amazon.com/events/ directly.' }] };
        }

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              count: events.length,
              events: events.map((e) => ({
                title: e.title,
                date: new Date(e.pubDate).toLocaleDateString(),
                description: e.contentSnippet,
                url: e.link,
                categories: e.categories,
              })),
            }, null, 2),
          }],
        };
      } catch {
        return { content: [{ type: 'text' as const, text: 'Unable to fetch events feed. Visit https://aws.amazon.com/events/ for the latest.' }] };
      }
    }
  );

  // Get learning paths (curated - these don't change often)
  server.tool(
    'get_learning_paths',
    'Get recommended AWS learning paths with associated services and difficulty levels.',
    {
      level: z.enum(['beginner', 'intermediate', 'advanced']).optional().describe('Filter by difficulty'),
    },
    async ({ level }) => {
      const paths = [
        { id: 'lp-1', name: 'AI/ML on AWS', services: ['Bedrock', 'SageMaker', 'Nova', 'Strands'], level: 'intermediate', url: 'https://aws.amazon.com/training/learn-about/machine-learning/' },
        { id: 'lp-2', name: 'Serverless Development', services: ['Lambda', 'API Gateway', 'DynamoDB', 'Step Functions'], level: 'beginner', url: 'https://aws.amazon.com/serverless/' },
        { id: 'lp-3', name: 'Agentic AI & MCP', services: ['Bedrock', 'Strands', 'MCP', 'AgentCore'], level: 'advanced', url: 'https://strandsagents.com/' },
        { id: 'lp-4', name: 'Cloud Architecture', services: ['VPC', 'ECS', 'RDS', 'CloudFront'], level: 'intermediate', url: 'https://aws.amazon.com/architecture/' },
        { id: 'lp-5', name: 'DevOps & CI/CD', services: ['CodePipeline', 'CDK', 'CloudFormation', 'Q Developer'], level: 'intermediate', url: 'https://aws.amazon.com/devops/' },
      ];

      const filtered = level ? paths.filter((p) => p.level === level) : paths;
      return { content: [{ type: 'text' as const, text: JSON.stringify({ paths: filtered }, null, 2) }] };
    }
  );

  // Create learning task from AWS content
  server.tool(
    'create_learning_task',
    'Create a FocusFlow task from an AWS article or learning goal. Automatically tagged with AWS.',
    {
      title: z.string().describe('Task title'),
      description: z.string().optional().describe('Description or source URL'),
      tags: z.array(z.string()).default([]).describe('Tags'),
      estimatedMinutes: z.number().default(30).describe('Time estimate'),
      priority: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
    },
    async ({ title, description, tags, estimatedMinutes, priority }) => {
      const task = store.createTask({
        title,
        description,
        category: 'Learning',
        tags: ['aws', ...tags],
        estimatedMinutes,
        priority,
      });

      return {
        content: [{
          type: 'text' as const,
          text: `Learning task created: "${task.title}" (ID: ${task.id}, Tags: ${['aws', ...tags].join(', ')})`,
        }],
      };
    }
  );
}
