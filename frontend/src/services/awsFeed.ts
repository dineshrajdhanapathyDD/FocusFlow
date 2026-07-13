/**
 * Fetches real-time AWS content via public RSS-to-JSON proxy.
 * Uses rss2json.com API (free tier: 10k requests/day) as a CORS-friendly proxy.
 */

const RSS2JSON_BASE = 'https://api.rss2json.com/v1/api.json?rss_url=';

const FEEDS = {
  blog: 'https://aws.amazon.com/blogs/aws/feed/',
  whats_new: 'https://aws.amazon.com/about-aws/whats-new/recent/feed/',
  machine_learning: 'https://aws.amazon.com/blogs/machine-learning/feed/',
  compute: 'https://aws.amazon.com/blogs/compute/feed/',
  devops: 'https://aws.amazon.com/blogs/devops/feed/',
  architecture: 'https://aws.amazon.com/blogs/architecture/feed/',
  security: 'https://aws.amazon.com/blogs/security/feed/',
  opensource: 'https://aws.amazon.com/blogs/opensource/feed/',
};

export type FeedSource = keyof typeof FEEDS;

export interface AWSFeedItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  categories: string[];
  source: FeedSource;
}

interface RSS2JSONResponse {
  status: string;
  items: {
    title: string;
    link: string;
    pubDate: string;
    description: string;
    categories: string[];
  }[];
}

// Cache
const feedCache: Map<string, { data: AWSFeedItem[]; ts: number }> = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 min

export async function fetchAWSFeed(source: FeedSource, limit = 10): Promise<AWSFeedItem[]> {
  const cacheKey = `${source}-${limit}`;
  const cached = feedCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  try {
    const url = `${RSS2JSON_BASE}${encodeURIComponent(FEEDS[source])}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const json: RSS2JSONResponse = await response.json();

    if (json.status !== 'ok') throw new Error('Feed parse error');

    const items: AWSFeedItem[] = json.items.slice(0, limit).map((item) => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      description: stripHtml(item.description).slice(0, 200),
      categories: item.categories || [],
      source,
    }));

    feedCache.set(cacheKey, { data: items, ts: Date.now() });
    return items;
  } catch (error) {
    console.warn(`Failed to fetch ${source} feed:`, error);
    return cached?.data || [];
  }
}

export async function fetchMultipleFeeds(sources: FeedSource[], limit = 5): Promise<AWSFeedItem[]> {
  const results = await Promise.allSettled(sources.map((s) => fetchAWSFeed(s, limit)));
  const items: AWSFeedItem[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      items.push(...result.value);
    }
  }

  // Sort by date, newest first
  items.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
  return items;
}

export async function searchAWSFeeds(query: string): Promise<AWSFeedItem[]> {
  const allItems = await fetchMultipleFeeds(['blog', 'whats_new', 'machine_learning', 'compute'], 15);
  const lowerQuery = query.toLowerCase();

  return allItems.filter(
    (item) =>
      item.title.toLowerCase().includes(lowerQuery) ||
      item.description.toLowerCase().includes(lowerQuery) ||
      item.categories.some((c) => c.toLowerCase().includes(lowerQuery))
  );
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
}
