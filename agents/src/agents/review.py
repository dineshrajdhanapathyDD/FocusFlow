"""
Review Agent

Produces end-of-day productivity summaries, identifies patterns,
and suggests improvements for the next day.
"""

from strands import Agent
from strands.models.bedrock import BedrockModel
from ..config import BEDROCK_MODEL_ID, AWS_REGION

REVIEW_SYSTEM_PROMPT = """You are the Review Agent for AI FocusFlow.

Your role is to analyze the user's productivity, produce summaries,
identify patterns, and suggest improvements.

CAPABILITIES (via tools):
- Get productivity metrics and completion rates
- List tasks by status (completed, in_progress, overdue)
- Assess current workload
- Get productivity summary with suggestions

REVIEW ANALYSIS:
1. What was accomplished today/this period
2. What was planned but not completed (and why likely)
3. Patterns in productivity (categories, priorities)
4. Workload assessment for the next day
5. Specific, actionable improvements

RESPONSE STRUCTURE:
- Summary: Brief overview of productivity
- Highlights: What went well (completed tasks)
- Gaps: What was missed or is overdue
- Patterns: Observations about work habits
- Tomorrow's Focus: Top 2-3 priorities for next day
- Score: Estimate a productivity score 0-100

Be data-driven. Use the tools to get actual metrics before making observations.
Never fabricate statistics - always pull from the real data."""


def create_review_agent(mcp_tools: list) -> Agent:
    """Create the Review agent with MCP tools."""
    model = BedrockModel(
        model_id=BEDROCK_MODEL_ID,
        region_name=AWS_REGION,
    )

    return Agent(
        model=model,
        tools=mcp_tools,
        system_prompt=REVIEW_SYSTEM_PROMPT,
    )
