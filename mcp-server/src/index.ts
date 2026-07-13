#!/usr/bin/env node
/**
 * AI FocusFlow MCP Server
 *
 * Exposes productivity tools via the Model Context Protocol.
 * Any MCP-compatible client (Claude, Kiro, Cursor, Strands Agents)
 * can connect and use these tools to manage tasks, generate plans, and get insights.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { registerTaskTools } from './tools/tasks.js';
import { registerPlannerTools } from './tools/planner.js';
import { registerAnalyticsTools } from './tools/analytics.js';
import { registerInsightsTools } from './tools/insights.js';
import { registerAWSNewsTools } from './tools/aws-news.js';

const server = new McpServer({
  name: 'focusflow',
  version: '1.0.0',
});

// Register all tool groups
registerTaskTools(server);
registerPlannerTools(server);
registerAnalyticsTools(server);
registerInsightsTools(server);
registerAWSNewsTools(server);

// Start the server with stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('FocusFlow MCP server running on stdio');
}

main().catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});
