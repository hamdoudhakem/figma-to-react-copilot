from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json
from app.core.llm import llm_client
from app.core.config import settings
from app.services.mcp_client import fetch_figma_node_data

router = APIRouter()


class GenerationRequest(BaseModel):
  figma_url: str
  prompt_override: str | None = None


@router.post("/generate")
async def generate_component(request: GenerationRequest):
  """
  Endpoint principal qui extrait les données Figma via MCP,
  les injecte dans Qwen-Coder et streame le code React/Tailwind généré.
  """
  if not request.figma_url:
    raise HTTPException(status_code=400, detail="L'URL Figma est manquante.")

  try:
    # 1. Extraction des données Figma nettoyées via le serveur MCP
    figma_json_str = await fetch_figma_node_data(request.figma_url)
  except Exception as e:
    raise HTTPException(
        status_code=500,
        detail=f"Erreur d'extraction MCP Figma : {str(e)}"
    )

  def stream_tokens():
    try:
      # 2. Construction du Prompt Système ultra-précis pour un rendu parfait
      system_prompt = (
          "Tu es un ingénieur Frontend d'élite expert en React et Tailwind CSS.\n"
          "Ta tâche est de convertir le graphe JSON d'un composant Figma en un composant React moderne, "
          "interactif, entièrement responsive et stylisé avec Tailwind CSS.\n\n"
          "CONSIGNES STRICTES :\n"
          "1. Retourne UNIQUEMENT le code du composant React.\n"
          "2. Ne mets AUCUNE explication textuelle avant ou après le code.\n"
          "3. Utilise uniquement des icônes SVG inline ou des émojis si des icônes sont requises (pas d'import lucide-react ou font-awesome).\n"
          "4. Le composant doit s'appeler obligatoirement 'App' et être exporté par défaut (default export).\n"
          "5. Assure-toi que toutes les couleurs, espacements et alignements décrits dans le JSON soient respectés avec précision.\n"
          "6. Le code doit être robuste, sans bugs de compilation et prêt à être rendu dans un navigateur."
      )

      # 3. Construction de la requête utilisateur contenant le JSON structurel de Figma
      user_content = (
          f"Voici les données structurelles du design Figma au format JSON :\n\n"
          f"```json\n{figma_json_str}\n```\n\n"
      )

      if request.prompt_override:
        user_content += f"Consignes additionnelles de l'utilisateur : {request.prompt_override}\n"

      user_content += "Génère maintenant le composant React exporté par défaut nommé 'App' avec son style Tailwind."

      # 4. Appel au LLM local (Ollama) en mode streaming
      response = llm_client.chat.completions.create(
          model=settings.LLM_MODEL,
          messages=[
              {"role": "system", "content": system_prompt},
              {"role": "user", "content": user_content}
          ],
          stream=True,
          temperature=0.1  # Température basse pour privilégier la précision du code
      )

      # 5. Diffusion des tokens au fur et à mesure de leur génération
      for chunk in response:
        token = chunk.choices[0].delta.content
        if token:
          yield token

    except Exception as e:
      yield f"Erreur lors de la génération IA : {str(e)}"

  return StreamingResponse(stream_tokens(), media_type="text/plain")
