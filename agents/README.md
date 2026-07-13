# AI FocusFlow - Strands Agents

Agentic productivity assistants powered by [Strands Agents SDK](https://strandsagents.com/) and [MCP (Model Context Protocol)](https://modelcontextprotocol.io/).

## Architecture

```
User Request → FastAPI → Strands Agent → Bedrock (Nova Lite)
                              ↕
                         MCP Client
                              ↕
                    FocusFlow MCP Server
                              ↕
                    Task Store (DynamoDB)
```

Each agent operates in an **agentic loop**: it reasons about the request, decides which tools to call, executes them via MCP, observes the results, and continues until the task is complete.

## Agents

| Agent | Endpoint | Purpose |
|-------|----------|---------|
| Orchestrator | `POST /agent/chat` | General-purpose agent, handles any request |
| Coach | `POST /agent/coach` | Workload analysis and productivity coaching |
| Planner | `POST /agent/plan` | Daily schedule generation |
| Breakdown | `POST /agent/breakdown` | Complex task decomposition |
| Review | `POST /agent/review` | End-of-day productivity summary |

## MCP Tools Available

The agents have access to 12+ tools via the FocusFlow MCP server:

- `list_tasks` - List tasks with filters
- `create_task` - Create new tasks
- `update_task` - Modify task fields
- `complete_task` - Mark tasks done
- `batch_create_tasks` - Create multiple tasks
- `generate_daily_plan` - Build optimized schedule
- `get_productivity_metrics` - Analytics data
- `assess_workload` - Workload level assessment
- `get_focus_recommendations` - What to work on next

## Setup

```bash
# Prerequisites: Python 3.11+, Node.js 20+ (for MCP server)

# Install the MCP server deps
cd ../mcp-server && npm install

# Install Python agent deps
cd ../agents
pip install -e .

# Set AWS credentials (for Bedrock access)
export AWS_REGION=us-east-1
export BEDROCK_MODEL_ID=us.amazon.nova-lite-v1:0

# Run the agent server
python -m src.server
```

The server starts on `http://localhost:5000`.

## Usage Examples

```bash
# Chat with the orchestrator
curl -X POST http://localhost:5000/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What should I focus on today?", "agent_type": "orchestrator"}'

# Get a productivity review
curl -X POST http://localhost:5000/agent/review

# Generate a daily plan
curl -X POST http://localhost:5000/agent/plan \
  -H "Content-Type: application/json" \
  -d '{"date": "2025-03-15", "message": "I have a meeting at 2pm"}'

# Break down a task
curl -X POST http://localhost:5000/agent/breakdown \
  -H "Content-Type: application/json" \
  -d '{"task_id": "task-123"}'

# List available MCP tools
curl http://localhost:5000/tools
```

## How It Works

1. **User sends request** → FastAPI receives it
2. **Agent created** → Strands Agent initialized with system prompt + MCP tools
3. **Agentic loop** → Agent calls Bedrock model, model decides which tools to use
4. **Tool execution** → MCP client calls the FocusFlow MCP server tools
5. **Observation** → Agent sees tool results, decides next step
6. **Response** → Final answer returned with tool call transparency
