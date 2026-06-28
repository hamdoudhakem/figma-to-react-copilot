from app.services.mcp_client import fetch_figma_node_data
import sys
import asyncio
import os
from dotenv import load_dotenv

# Charger les variables d'environnement du fichier .env
load_dotenv()

# Ajuster le chemin d'importation pour s'assurer que Python trouve l'application
sys.path.append(os.path.dirname(os.path.abspath(__file__)))


async def main():
  # 1. Remplace cette URL par celle de ton composant Figma de test
  test_url = "https://www.figma.com/design/Wc4OT5kElgQOxHBqm89MoB/figma-to-react-copilot?node-id=1-7&t=2RjoXYmoZeCQnsHW-4"

  print("🚀 Démarrage du test MCP Figma...")
  print(f"🔗 Analyse de l'URL : {test_url}")

  if "VOTRE_FILE_KEY" in test_url:
    print("⚠️  Attention : Tu dois remplacer 'test_url' dans le script par une vraie URL Figma !")
    return

  try:
    # 2. Appel de la fonction de récupération
    print("⏳ Appel du serveur MCP (ceci peut prendre 2-3 secondes la première fois car npx télécharge le serveur)...")
    result_json = await fetch_figma_node_data(test_url)

    print("\n✅ Succès ! Données reçues du serveur MCP :")
    print("-" * 50)
    # Afficher les 1000 premiers caractères du JSON pour vérifier la structure
    print(result_json[:1000] + ("..." if len(result_json) > 1000 else ""))
    print("-" * 50)
    print(f"Taille totale des données simplifiées reçues : {len(result_json)} caractères.")

  except Exception as e:
    print("\n❌ Échec du test MCP.")
    print(f"Erreur rencontrée : {str(e)}")

if __name__ == "__main__":
  asyncio.run(main())

# async def main():
#   print("🔍 Connexion au serveur MCP pour lister les outils disponibles...")

#   import os
#   from mcp import ClientSession, StdioServerParameters
#   from mcp.client.stdio import stdio_client
#   from app.core.config import settings

#   server_params = StdioServerParameters(
#       command="npx",
#       args=["-y", "@tmegit/figma-developer-mcp", "--stdio"],
#       env={**os.environ, "FIGMA_API_KEY": settings.FIGMA_ACCESS_TOKEN}
#   )

#   async with stdio_client(server_params) as (read_stream, write_stream):
#     async with ClientSession(read_stream, write_stream) as session:
#       await session.initialize()

#       # 🎯 On demande nativement la liste des outils au serveur MCP
#       tools_response = await session.list_tools()

#       print("\n🛠️  OUTILS TROUVÉS SUR CE SERVEUR MCP :")
#       print("-" * 50)
#       for tool in tools_response.tools:
#         print(f"👉 Nom de l'outil : {tool.name}")
#         print(f"   Description   : {tool.description}\n")
#       print("-" * 50)

# if __name__ == "__main__":
#   asyncio.run(main())
