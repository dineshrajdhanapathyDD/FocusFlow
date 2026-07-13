"""Configuration for Strands Agents."""

import os
from pathlib import Path

# Bedrock model configuration
BEDROCK_MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "us.amazon.nova-lite-v1:0")
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")

# MCP server path (the TypeScript MCP server)
MCP_SERVER_DIR = Path(__file__).parent.parent.parent / "mcp-server"
MCP_SERVER_CMD = "npx"
MCP_SERVER_ARGS = ["tsx", str(MCP_SERVER_DIR / "src" / "index.ts")]

# Agent API port
AGENT_API_PORT = int(os.environ.get("AGENT_API_PORT", "5000"))
