import asyncio
import os
from urllib.parse import urlparse, parse_qs
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from app.core.config import settings


def parse_figma_url(url: str) -> tuple[str, str | None]:
  """
  Analyse une URL Figma et extrait la clé de fichier (file_key) et l'identifiant de nœud (node_id).
  Exemple : https://www.figma.com/design/AbCdEfGhIjKlMn/My-Project?node-id=102-34
  Retourne : (file_key, node_id)
  """
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
  """
  Démarre localement le serveur MCP Figma via npx, interroge le JSON du nœud de design,
  et renvoie le flux JSON simplifié et orienté UI pour le modèle.
  """
  file_key, node_id = parse_figma_url(figma_url)
  if not file_key:
    raise ValueError("Impossible d'extraire le File Key Figma depuis l'URL fournie.")

  if not settings.FIGMA_ACCESS_TOKEN:
    raise ValueError("Le token d'accès FIGMA_ACCESS_TOKEN est manquant dans l'environnement.")

  # Configuration du transport stdio vers le serveur MCP Figma optimisé
  server_params = StdioServerParameters(
      command="npx",
      args=["-y", "@tmegit/figma-developer-mcp", "--stdio"],
      env={
          **os.environ,
          "FIGMA_API_KEY": settings.FIGMA_ACCESS_TOKEN
      }
  )

  async with stdio_client(server_params) as (read_stream, write_stream):
    async with ClientSession(read_stream, write_stream) as session:
      await session.initialize()

      arguments = {"fileKey": file_key}
      if node_id:
        arguments["nodeId"] = node_id

      # Appel de l'outil exposé par le serveur MCP Figma
      result = await session.call_tool("get_figma_design", arguments=arguments)

      if result and result.content:
        return result.content[0].text

      raise RuntimeError("Le serveur Figma MCP a retourné un contenu vide.")
