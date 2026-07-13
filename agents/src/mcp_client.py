"""MCP client setup for connecting Strands Agents to the FocusFlow MCP server."""

from strands.tools.mcp import MCPClient
from .config import MCP_SERVER_CMD, MCP_SERVER_ARGS


def create_mcp_client() -> MCPClient:
    """
    Create an MCP client that connects to the FocusFlow MCP server via stdio.
    The MCP server exposes task management, planner, analytics, and insights tools.
    """
    return MCPClient(
        command=MCP_SERVER_CMD,
        args=MCP_SERVER_ARGS,
    )
