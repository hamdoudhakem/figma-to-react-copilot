import os
import sys
from urllib.parse import urlparse, parse_qs
import mcp.types
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from app.core.config import settings

# ==============================================================================
# 🛠️ PROTOCOL SHIELD: MONKEYPATCH TO FILTER OUT UNEXPECTED NODE CONSOLE LOGS
# ==============================================================================
_orig_validate_json = mcp.types.JSONRPCMessage.model_validate_json


@classmethod
def _resilient_validate_json(cls, json_data, *args, **kwargs):
  """Intercepts raw stdout streams, silencing text debug noise from the server."""
  try:
    data_str = json_data.decode('utf-8', errors='ignore') if isinstance(json_data, bytes) else str(json_data)

    # If the line doesn't start with a JSON bracket, it's a rogue console.log statement.
    # FIX: We now use a valid parameter-less specification method to completely bypass Pydantic validation noise.
    if not data_str.strip().startswith("{"):
      return _orig_validate_json('{"jsonrpc": "2.0", "method": "notifications/tools/list_changed"}')

    return _orig_validate_json(json_data, *args, **kwargs)
  except Exception:
    return _orig_validate_json('{"jsonrpc": "2.0", "method": "notifications/tools/list_changed"}')


# Bind the interceptor directly into the MCP parsing library
mcp.types.JSONRPCMessage.model_validate_json = _resilient_validate_json
# ==============================================================================


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
  raw_node_id = query.get("node-id", [None])[0]

  # Ensure the standard API colon formatting is applied if a node ID exists
  node_id = raw_node_id.replace("-", ":") if raw_node_id else None
  return file_key, node_id


async def fetch_figma_node_data(figma_url: str) -> str:
  """Spins up the MCP server and maps parameters dynamically to the new tool schema"""
  file_key, node_id = parse_figma_url(figma_url)
  if not file_key:
    raise ValueError("Invalid Figma URL schema. Unable to extract File Key.")

  if not settings.FIGMA_ACCESS_TOKEN:
    raise ValueError("FIGMA_ACCESS_TOKEN is completely missing from your environmental configurations.")

  mcp_command = "npx.cmd" if sys.platform == "win32" else "npx"

  server_params = StdioServerParameters(
      command=mcp_command,
      args=["-y", "@tmegit/figma-developer-mcp", "--stdio"],
      env={**os.environ, "FIGMA_API_KEY": settings.FIGMA_ACCESS_TOKEN}
  )

  async with stdio_client(server_params) as (read_stream, write_stream):
    async with ClientSession(read_stream, write_stream) as session:
      await session.initialize()

      # 1. Fetch the live tool definitions from the server
      tools_manifest = await session.list_tools()

      # 2. Update target to the author's new tool name
      target_tool = "get_figma_design"

      # Find the specific tool schema definition
      tool_def = next((t for t in tools_manifest.tools if t.name == target_tool), None)
      if not tool_def:
        raise ValueError(f"Critical: Target tool '{target_tool}' was not found on this MCP server.")

      # 3. SELF-HEALING PARAMETER MAPPING
      arguments = {}
      schema_props = tool_def.inputSchema.get("properties", {}) if hasattr(tool_def, "inputSchema") else {}

      # Map the File Key parameter dynamically
      if "file_key" in schema_props:
        arguments["file_key"] = file_key
      elif "fileKey" in schema_props:
        arguments["fileKey"] = file_key
      else:
        arguments["fileKey"] = file_key

      # Map the Node ID parameter dynamically if it exists in the URL
      if node_id:
        if "node_id" in schema_props:
          arguments["node_id"] = node_id
        elif "nodeId" in schema_props:
          arguments["nodeId"] = node_id
        elif "ids" in schema_props:
          arguments["ids"] = [node_id]
        else:
          arguments["nodeId"] = node_id

      print(f"🚀 [MCP Invocation]: Routing to updated tool '{target_tool}' with schema arguments: {arguments}")

      # 4. Execute the tool call
      result = await session.call_tool(target_tool, arguments)

      if not result.content or len(result.content) == 0:
        raise ValueError("The Figma MCP server returned an empty content body response.")

      response_text = result.content[0].text

      if "error" in response_text.lower() or "-32602" in response_text:
        raise ValueError(f"Figma MCP server rejected parameters: {response_text}")

      return response_text
