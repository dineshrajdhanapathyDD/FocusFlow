# MCP + Strands Agents Integration Guide

## Overview

AI FocusFlow uses two complementary technologies for agentic AI:

1. **MCP Server** (TypeScript) - Exposes productivity tools via the Model Context Protocol
2. **Strands Agents** (Python) - Autonomous AI agents that use those tools in an agentic loop

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend  (React)                                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Agentic Chat UI                                    │   │
│  │  - Agent selector (Coach/Planner/Breakdown/Review)  │   │
│  │  - Tool call transparency panel                     │   │
│  │  - Standard ↔ Agentic mode toggle                   │   │
│  └──────────────────────────┬──────────────────────────┘   │
└─────────────────────────────┼───────────────────────────────┘
                              │ POST /api/agent/*
┌─────────────────────────────┼───────────────────────────────┐
│  Backend  (Node.js Lambda)  │                               │
│  ┌──────────────────────────▼──────────────────────────┐   │
│  │  agents.ts handler (proxy)                          │   │
│  └──────────────────────────┬──────────────────────────┘   │
└─────────────────────────────┼───────────────────────────────┘
                              │ HTTP to :5000
┌─────────────────────────────┼───────────────────────────────┐
│  Strands Agents  (Python FastAPI)                           │
│  ┌──────────────────────────▼──────────────────────────┐   │
│  │  Agent (Coach/Planner/Breakdown/Review/Orchestrator) │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │  Agentic Loop:                               │   │   │
│  │  │  1. Reason about request                     │   │   │
│  │  │  2. Decide which MCP tool to call            │   │   │
│  │  │  3. Call tool via MCP client                  │   │   │
│  │  │  4. Observe result                           │   │   │
│  │  │  5. Repeat or respond                        │   │   │
│  │  └──────────────────────┬───────────────────────┘   │   │
│  └─────────────────────────┼───────────────────────────┘   │
└────────────────────────────┼────────────────────────────────┘
                             │ stdio (MCP protocol)
┌────────────────────────────┼────────────────────────────────┐
│  MCP Server  (TypeScript)  │                                │
│  ┌─────────────────────────▼───────────────────────────┐   │
│  │  12 Tools:                                          │   │
│  │  Tasks: list, get, create, update, complete, delete │   │
│  │  Planner: get_plan, generate_plan, add_block        │   │
│  │  Analytics: metrics, workload, overdue              │   │
│  │  Insights: summary, focus_recommendations           │   │
│  └──────────────────────────┬──────────────────────────┘   │
│                             │                               │
│                    In-memory Store / DynamoDB                │
└─────────────────────────────────────────────────────────────┘
```

## Running Locally

You need three processes:

```bash
# Terminal 1: Frontend
cd frontend && npm run dev

# Terminal 2: Backend API (proxies to agents)
cd backend && npm run dev

# Terminal 3: Strands Agents + MCP Server
cd agents && python -m src.server
```

The Strands agent server automatically starts the MCP server as a subprocess via stdio.

## Using the MCP Server in Kiro/VS Code

Add this to your `.kiro/settings/mcp.json`:

```json
{
  "mcpServers": {
    "focusflow": {
      "command": "npx",
      "args": ["tsx", "mcp-server/src/index.ts"],
      "env": {},
      "disabled": false
    }
  }
}
```

This lets you use FocusFlow tools directly in Kiro chat:
- "List my tasks" → calls `list_tasks`
- "What should I focus on?" → calls `get_focus_recommendations`
- "Create a task to review PRs" → calls `create_task`
- "Plan my day" → calls `generate_daily_plan`

## Available MCP Tools

| Tool | Description |
|------|-------------|
| `list_tasks` | List tasks with optional status/priority/category filters |
| `get_task` | Get full details of a task by ID |
| `create_task` | Create a new task |
| `update_task` | Update task fields (status, priority, progress) |
| `complete_task` | Mark a task as completed |
| `delete_task` | Permanently delete a task |
| `batch_create_tasks` | Create multiple tasks at once |
| `get_daily_plan` | Get schedule for a date |
| `generate_daily_plan` | AI-generate optimized schedule |
| `add_time_block` | Add meeting/event to plan |
| `get_productivity_metrics` | Completion rates, categories, deadlines |
| `assess_workload` | Current workload level assessment |
| `get_overdue_tasks` | List overdue tasks |
| `get_productivity_summary` | Full summary with suggestions |
| `get_focus_recommendations` | What to work on next |

## Strands Agent Details

Each agent uses:
- **Model**: Amazon Bedrock Nova Lite (fast, cost-effective)
- **Tools**: All 15 MCP tools via `strands.tools.mcp.MCPClient`
- **Transport**: stdio (MCP server runs as subprocess)
- **Loop**: Autonomous - agent decides when to call tools and when to respond

### Agent System Prompts

The agents are designed with specific personalities:

- **Orchestrator**: Can handle any request. Routes intelligently.
- **Coach**: Focuses on priorities, workload balance, actionable advice.
- **Planner**: Creates time-blocked schedules with energy awareness.
- **Breakdown**: Decomposes large tasks using verb-led subtask names.
- **Review**: Data-driven summaries with patterns and scores.

## API Endpoints (via Backend Proxy)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/agent/chat` | Chat with any agent (specify `agent_type`) |
| POST | `/api/agent/coach` | Get coaching advice |
| POST | `/api/agent/plan` | Generate daily plan |
| POST | `/api/agent/breakdown` | Break down a task |
| POST | `/api/agent/review` | Get productivity review |
| GET | `/api/agent/tools` | List available MCP tools |

### Example Request

```bash
curl -X POST http://localhost:4000/api/agent/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer demo-token" \
  -d '{
    "message": "I have 2 hours before lunch. What should I work on?",
    "agent_type": "coach"
  }'
```

### Example Response

```json
{
  "response": "Based on your current tasks, I recommend focusing on...",
  "agent_type": "coach",
  "tool_calls": [
    {"tool": "list_tasks", "input": {"status": "todo"}},
    {"tool": "assess_workload", "input": {}},
    {"tool": "get_focus_recommendations", "input": {"availableMinutes": 120}}
  ],
  "success": true
}
```

## Extending with New Tools

### Adding an MCP Tool

Edit `mcp-server/src/tools/` and register with the McpServer:

```typescript
server.tool(
  'my_new_tool',
  'Description of what the tool does',
  { param: z.string().describe('Parameter description') },
  async ({ param }) => {
    // Implementation
    return { content: [{ type: 'text', text: 'Result' }] };
  }
);
```

### Adding a Strands Agent

Create a new file in `agents/src/agents/`:

```python
from strands import Agent
from strands.models.bedrock import BedrockModel
from ..config import BEDROCK_MODEL_ID, AWS_REGION

def create_my_agent(mcp_tools: list) -> Agent:
    model = BedrockModel(model_id=BEDROCK_MODEL_ID, region_name=AWS_REGION)
    return Agent(
        model=model,
        tools=mcp_tools,
        system_prompt="Your agent's system prompt here",
    )
```

The agent automatically gets access to all MCP tools and can call them autonomously.
