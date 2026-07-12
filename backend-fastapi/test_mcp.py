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
