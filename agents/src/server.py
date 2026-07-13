"""
FastAPI server exposing Strands Agents as HTTP endpoints.
Connects to the FocusFlow MCP server for tool access.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import asyncio

from .config import AGENT_API_PORT
from .mcp_client import create_mcp_client
from .agents import (
    create_coach_agent,
    create_planner_agent,
    create_breakdown_agent,
    create_review_agent,
    create_orchestrator_agent,
    create_aws_learning_agent,
)

# Global MCP client instance
mcp_client = None
mcp_tools = []


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start MCP client on startup, stop on shutdown."""
    global mcp_client, mcp_tools
    mcp_client = create_mcp_client()
    mcp_tools = mcp_client.start()
    print(f"MCP client connected. {len(mcp_tools)} tools available:")
    for tool in mcp_tools:
        print(f"  - {tool.tool_name}")
    yield
    mcp_client.stop()
    print("MCP client disconnected.")


app = FastAPI(
    title="AI FocusFlow Agents API",
    description="Strands-powered agentic productivity assistants with MCP tool integration",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===== Request/Response Models =====

class AgentRequest(BaseModel):
    message: str = Field(..., description="User message to the agent")
    agent_type: str = Field(
        default="orchestrator",
        description="Agent to use: coach, planner, breakdown, review, orchestrator"
    )
    context: Optional[dict] = Field(default=None, description="Additional context")


class AgentResponse(BaseModel):
    response: str = Field(..., description="Agent's response text")
    agent_type: str
    tool_calls: list[dict] = Field(default_factory=list, description="Tools the agent called")
    success: bool = True


class BreakdownRequest(BaseModel):
    task_id: str = Field(..., description="ID of the task to break down")
    message: Optional[str] = Field(default=None, description="Additional instructions")


class PlanRequest(BaseModel):
    date: Optional[str] = Field(default=None, description="Date to plan (YYYY-MM-DD)")
    message: Optional[str] = Field(default=None, description="Planning preferences")


# ===== Endpoints =====

@app.get("/health")
async def health():
    return {"status": "healthy", "tools_connected": len(mcp_tools)}


@app.post("/agent/chat", response_model=AgentResponse)
async def agent_chat(request: AgentRequest):
    """Send a message to any agent. The agent uses MCP tools autonomously."""
    try:
        agent = _get_agent(request.agent_type)
        result = agent(request.message)

        # Extract tool call info from the agent's execution
        tool_calls = _extract_tool_calls(result)

        return AgentResponse(
            response=str(result),
            agent_type=request.agent_type,
            tool_calls=tool_calls,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/agent/breakdown", response_model=AgentResponse)
async def agent_breakdown(request: BreakdownRequest):
    """Break down a specific task into subtasks using the Breakdown agent."""
    try:
        agent = create_breakdown_agent(mcp_tools)
        message = f"Break down the task with ID: {request.task_id}"
        if request.message:
            message += f". Additional context: {request.message}"

        result = agent(message)
        tool_calls = _extract_tool_calls(result)

        return AgentResponse(
            response=str(result),
            agent_type="breakdown",
            tool_calls=tool_calls,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/agent/plan", response_model=AgentResponse)
async def agent_plan(request: PlanRequest):
    """Generate a daily plan using the Planning agent."""
    try:
        agent = create_planner_agent(mcp_tools)
        message = "Create an optimized daily plan for today."
        if request.date:
            message = f"Create an optimized daily plan for {request.date}."
        if request.message:
            message += f" {request.message}"

        result = agent(message)
        tool_calls = _extract_tool_calls(result)

        return AgentResponse(
            response=str(result),
            agent_type="planner",
            tool_calls=tool_calls,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/agent/review", response_model=AgentResponse)
async def agent_review():
    """Get a productivity review from the Review agent."""
    try:
        agent = create_review_agent(mcp_tools)
        result = agent("Give me a comprehensive productivity review for today. What did I accomplish, what's pending, and what should I focus on tomorrow?")
        tool_calls = _extract_tool_calls(result)

        return AgentResponse(
            response=str(result),
            agent_type="review",
            tool_calls=tool_calls,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/agent/coach", response_model=AgentResponse)
async def agent_coach(request: AgentRequest):
    """Get coaching advice from the Productivity Coach agent."""
    try:
        agent = create_coach_agent(mcp_tools)
        result = agent(request.message)
        tool_calls = _extract_tool_calls(result)

        return AgentResponse(
            response=str(result),
            agent_type="coach",
            tool_calls=tool_calls,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/tools")
async def list_tools():
    """List all available MCP tools."""
    return {
        "count": len(mcp_tools),
        "tools": [
            {"name": tool.tool_name, "description": getattr(tool, "description", "")}
            for tool in mcp_tools
        ],
    }


# ===== AWS Learning Endpoints =====

class AWSDigestRequest(BaseModel):
    interests: Optional[list[str]] = Field(default=None, description="User's AWS interests (e.g., ['bedrock', 'lambda'])")


class AWSSearchRequest(BaseModel):
    query: str = Field(..., description="Search query for AWS content")
    message: Optional[str] = Field(default=None, description="Additional context for the agent")


class AWSLearnRequest(BaseModel):
    message: str = Field(..., description="What the user wants to learn about")
    topic: Optional[str] = Field(default=None, description="Specific AWS topic")


@app.post("/agent/aws/digest", response_model=AgentResponse)
async def agent_aws_digest(request: AWSDigestRequest = AWSDigestRequest()):
    """Get a curated daily AWS digest with news, events, and learning recommendations."""
    try:
        agent = create_aws_learning_agent(mcp_tools)
        message = "Give me my daily AWS digest. What's new, what events are coming up, and what should I learn today?"
        if request.interests:
            message += f" My interests: {', '.join(request.interests)}"

        result = agent(message)
        tool_calls = _extract_tool_calls(result)

        return AgentResponse(
            response=str(result),
            agent_type="aws_learning",
            tool_calls=tool_calls,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/agent/aws/learn", response_model=AgentResponse)
async def agent_aws_learn(request: AWSLearnRequest):
    """Ask the AWS Learning agent to help you learn about a topic, find resources, or create study tasks."""
    try:
        agent = create_aws_learning_agent(mcp_tools)
        message = request.message
        if request.topic:
            message += f" Topic: {request.topic}"

        result = agent(message)
        tool_calls = _extract_tool_calls(result)

        return AgentResponse(
            response=str(result),
            agent_type="aws_learning",
            tool_calls=tool_calls,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/agent/aws/events", response_model=AgentResponse)
async def agent_aws_events():
    """Get upcoming AWS events with recommendations on which to attend."""
    try:
        agent = create_aws_learning_agent(mcp_tools)
        result = agent(
            "What AWS events are coming up? Which ones are free? "
            "Which would be most valuable for someone working with serverless and AI/ML on AWS? "
            "Create a learning task for the most relevant upcoming event."
        )
        tool_calls = _extract_tool_calls(result)

        return AgentResponse(
            response=str(result),
            agent_type="aws_learning",
            tool_calls=tool_calls,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/agent/aws/skill-plan", response_model=AgentResponse)
async def agent_aws_skill_plan(request: AWSLearnRequest):
    """Generate an AWS learning plan with tasks, articles, and events for a specific skill."""
    try:
        agent = create_aws_learning_agent(mcp_tools)
        message = (
            f"Create a structured learning plan for: {request.message}. "
            "Find relevant articles, check for upcoming workshops or events, "
            "and create a series of learning tasks with progressive difficulty. "
            "Include time estimates and suggest a realistic schedule."
        )

        result = agent(message)
        tool_calls = _extract_tool_calls(result)

        return AgentResponse(
            response=str(result),
            agent_type="aws_learning",
            tool_calls=tool_calls,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===== Helpers =====

def _get_agent(agent_type: str):
    """Get the appropriate agent based on type."""
    agents = {
        "coach": create_coach_agent,
        "planner": create_planner_agent,
        "breakdown": create_breakdown_agent,
        "review": create_review_agent,
        "orchestrator": create_orchestrator_agent,
        "aws_learning": create_aws_learning_agent,
    }

    factory = agents.get(agent_type, create_orchestrator_agent)
    return factory(mcp_tools)


def _extract_tool_calls(result) -> list[dict]:
    """Extract tool call information from the agent result for transparency."""
    tool_calls = []
    try:
        if hasattr(result, "messages"):
            for msg in result.messages:
                if hasattr(msg, "tool_calls"):
                    for tc in msg.tool_calls:
                        tool_calls.append({
                            "tool": tc.get("name", "unknown"),
                            "input": tc.get("input", {}),
                        })
    except Exception:
        pass
    return tool_calls


def main():
    """Run the agent server."""
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=AGENT_API_PORT)


if __name__ == "__main__":
    main()
