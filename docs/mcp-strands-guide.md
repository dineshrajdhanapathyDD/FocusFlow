# MCP + Strands Agents Integration Guide

## Overview

AI FocusFlow uses two complementary technologies for advanced agentic AI:

1. **MCP Server** (TypeScript) — Exposes 21 productivity tools via the Model Context Protocol
2. **Strands Agents** (Python) — 6 autonomous AI agents that use those tools in an agentic loop

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  Frontend  (React)                                               │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  AI Assistant (Agentic Mode) / AWS Hub AI Guide            │ │
│  └──────────────────────────┬─────────────────────────────────┘ │
└─────────────────────────────┼────────────────────────────────────┘
                              │ POST /api/ai/chat (Bedrock)
                              │ POST /api/agent/* (Strands - optional)
┌─────────────────────────────┼────────────────────────────────────┐
│  Backend (Lambda / FastAPI)  │                                    │
│  ┌───────────────────────────▼────────────────────────────────┐ │
│  │  AI Lambda (Bedrock) — Always available                    │ │
│  │  Agent Proxy → Strands service — When running locally      │ │
│  └───────────────────────────┬────────────────────────────────┘ │
└──────────────────────────────┼───────────────────────────────────┘
                               │ HTTP to :5000 (local)
┌──────────────────────────────┼───────────────────────────────────┐
│  Strands Agents (Python FastAPI)                                  │
│  ┌───────────────────────────▼────────────────────────────────┐ │
│  │  Agent (Coach / Planner / Breakdown / Review / AWS / Orch) │ │
│  │  ┌─────────────────────────────────────────────────────┐   │ │
│  │  │  Agentic Loop:                                      │   │ │
│  │  │  1. Reason about request (Bedrock)                  │   │ │
│  │  │  2. Decide which MCP tool to call                   │   │ │
│  │  │  3. Execute tool via MCP client                     │   │ │
│  │  │  4. Observe result                                  │   │ │
│  │  │  5. Repeat or respond                               │   │ │
│  │  └──────────────────────────┬──────────────────────────┘   │ │
│  └─────────────────────────────┼──────────────────────────────┘ │
└────────────────────────────────┼────────────────────────────────┘
                                 │ stdio (MCP protocol)
┌────────────────────────────────┼────────────────────────────────┐
│  MCP Server (TypeScript)       │                                 │
│  ┌─────────────────────────────▼──────────────────────────────┐ │
│  │  21 Tools:                                                 │ │
│  │                                                            │ │
│  │  TASKS: list · get · create · update · complete · delete   │ │
│  │         batch_create                                       │ │
│  │  PLANNER: get_plan · generate_plan · add_block             │ │
│  │  ANALYTICS: metrics · workload · overdue                   │ │
│  │  INSIGHTS: summary · focus_recommendations                 │ │
│  │  AWS NEWS: articles · whats_new · events · daily_digest    │ │
│  │            search · learning_paths · create_learning_task   │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Running Locally

You need three terminals:

```bash
# Terminal 1: Frontend
cd frontend && npm run dev         # http://localhost:3000

# Terminal 2: Backend API
cd backend && npm run dev          # http://localhost:4000

# Terminal 3: Strands Agents (starts MCP server automatically)
cd agents && pip install -e . && python -m src.server  # http://localhost:5000
```

The Strands agent server automatically spawns the MCP server as a subprocess via stdio.

## Using the MCP Server in Kiro

Add to your `.kiro/settings/mcp.json`:

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

Then use FocusFlow tools directly in Kiro chat:
- "List my tasks" → `list_tasks`
- "What should I focus on?" → `get_focus_recommendations`
- "What's new on AWS?" → `get_aws_whats_new`
- "Create a task to learn Bedrock" → `create_learning_task`

## All MCP Tools (21)

### Tasks (7 tools)
| Tool | Description |
|------|-------------|
| `list_tasks` | List tasks with status/priority/category filters |
| `get_task` | Get full details by ID |
| `create_task` | Create a new task |
| `update_task` | Update fields (status, priority, progress) |
| `complete_task` | Mark as completed |
| `delete_task` | Permanently delete |
| `batch_create_tasks` | Create multiple tasks at once |

### Planner (3 tools)
| Tool | Description |
|------|-------------|
| `get_daily_plan` | Get schedule for a date |
| `generate_daily_plan` | AI-generate optimized schedule |
| `add_time_block` | Add meeting/event/break |

### Analytics (3 tools)
| Tool | Description |
|------|-------------|
| `get_productivity_metrics` | Completion rates, categories, deadlines |
| `assess_workload` | Current workload level + recommendation |
| `get_overdue_tasks` | List overdue tasks |

### Insights (2 tools)
| Tool | Description |
|------|-------------|
| `get_productivity_summary` | Full summary with suggestions |
| `get_focus_recommendations` | What to work on next |

### AWS News (6 tools — Real-time RSS)
| Tool | Description |
|------|-------------|
| `get_aws_articles` | Fetch from 8 AWS blog RSS feeds |
| `get_aws_whats_new` | Latest service announcements |
| `get_aws_events` | Upcoming events |
| `get_aws_daily_digest` | Combined morning briefing |
| `search_aws_content` | Search across all feeds |
| `get_learning_paths` | Curated skill paths |
| `create_learning_task` | Turn articles into tasks |

## Strands Agents (6)

| Agent | Endpoint | What it does |
|-------|----------|-------------|
| **Orchestrator** | `/agent/chat` | General purpose — routes any request |
| **Coach** | `/agent/coach` | Workload analysis, priority coaching |
| **Planner** | `/agent/plan` | Daily schedule generation |
| **Breakdown** | `/agent/breakdown` | Complex task decomposition |
| **Review** | `/agent/review` | End-of-day productivity summary |
| **AWS Learning** | `/agent/aws/*` | AWS news curation, learning plans |

Each agent:
- Uses **Amazon Bedrock Nova Lite** as the reasoning model
- Has access to **all 21 MCP tools** via `strands.tools.mcp.MCPClient`
- Operates in an **autonomous agentic loop** (reason → act → observe → repeat)
- Returns tool call transparency (which tools were used)

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/agent/chat` | Chat with any agent |
| POST | `/api/agent/coach` | Coaching advice |
| POST | `/api/agent/plan` | Generate plan |
| POST | `/api/agent/breakdown` | Break down task |
| POST | `/api/agent/review` | Productivity review |
| POST | `/api/agent/aws/digest` | AWS daily digest |
| POST | `/api/agent/aws/learn` | Learn about AWS topic |
| POST | `/api/agent/aws/events` | Event recommendations |
| POST | `/api/agent/aws/skill-plan` | Generate learning plan |
| GET | `/api/agent/tools` | List MCP tools |

## Extending

### Add a new MCP tool

In `mcp-server/src/tools/`, register with the server:

```typescript
server.tool(
  'my_tool_name',
  'Description for the AI to understand when to use this tool',
  { param: z.string().describe('What this param is for') },
  async ({ param }) => {
    // Your logic here
    return { content: [{ type: 'text', text: 'Result' }] };
  }
);
```

### Add a new Strands agent

Create `agents/src/agents/my_agent.py`:

```python
from strands import Agent
from strands.models.bedrock import BedrockModel
from ..config import BEDROCK_MODEL_ID, AWS_REGION

def create_my_agent(mcp_tools: list) -> Agent:
    return Agent(
        model=BedrockModel(model_id=BEDROCK_MODEL_ID, region_name=AWS_REGION),
        tools=mcp_tools,
        system_prompt="You are... (define role, capabilities, response format)",
    )
```

The agent automatically gets all 21 MCP tools and can call them autonomously.

---

## Related Documentation

- [Architecture Overview](./architecture.md)
- [Amazon Bedrock Setup](./bedrock-setup.md)
- [Deployment Guide](./deployment-guide.md)
- [Project Article](./article.md)
- [Architecture Diagram](./architecture-diagram.drawio)
