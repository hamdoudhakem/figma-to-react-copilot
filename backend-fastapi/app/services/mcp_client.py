import os
import asyncio
from urllib.parse import urlparse, parse_qs
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from app.core.config import settings


def parse_figma_url(url: str) -> tuple[str, str | None]:
  """Extracts file key and structural node ID from a live Figma URL canvas link"""
  parsed = urlparse(url)
  path_parts = parsed.path.strip("/").split("/")

  file_key = None
  if "design" in path_parts or "file" in path_parts:
    idx = path_parts.index("design") if "design" in path_parts else path_parts.index("file")
    if len(path_parts) > idx + 1:
      file_key = path_parts[idx + 1]
  elif len(path_parts) >= 2:
    file_key = path_parts[1]

  query = parse_qs(parsed.query)
  node_id = query.get("node-id", [None])[0]
  return file_key, node_id


async def fetch_figma_node_data(figma_url: str) -> str:
  """Spins up an MCP server via stdio transport context to extract layout elements"""
  file_key, node_id = parse_figma_url(figma_url)
  if not file_key:
    raise ValueError("Invalid Figma URL schema. Unable to extract File Key.")

  if not settings.FIGMA_ACCESS_TOKEN:
    raise ValueError("FIGMA_ACCESS_TOKEN is completely missing from your environmental configurations.")

  # Initialize Model Context Protocol client configurations
  server_params = StdioServerParameters(
      command="npx",
      args=["-y", "@tmegit/figma-developer-mcp", "--stdio"],
      env={**os.environ, "FIGMA_API_KEY": settings.FIGMA_ACCESS_TOKEN}
  )

  async with stdio_client(server_params) as (read_stream, write_stream):
    async with ClientSession(read_stream, write_stream) as session:
      await session.initialize()

      arguments = {"fileKey": file_key}
      if node_id:
        arguments["nodeId"] = node_id

      # Interrogating the server component capability tool matrix
      result = await session.call_tool("get-node-structural-json", arguments)
      return result.content[0].text
