from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.core.llm import llm_client
from app.core.config import settings

router = APIRouter()


class GenerationRequest(BaseModel):
  figma_url: str
  prompt_override: str | None = None


@router.post("/generate")
async def generate_component(request: GenerationRequest):
  """
  Temporary endpoint that streams back model outputs.
  Next step will weave the MCP Server call into this routine!
  """
  if not request.figma_url:
    raise HTTPException(status_code=400, detail="Figma URL is missing.")

  def stream_tokens():
    try:
      # Fake prompt until MCP tool pipeline connects the actual JSON data
      system_prompt = "You are an expert Frontend Engineer. Output ONLY valid React code with Tailwind CSS inside a single markdown block."
      user_content = f"Generate a component matching this layout request. Target URL context: {request.figma_url}"

      response = llm_client.chat.completions.create(
          model=settings.LLM_MODEL,
          messages=[
              {"role": "system", "content": system_prompt},
              {"role": "user", "content": user_content}
          ],
          stream=True,
          temperature=0.2
      )

      for chunk in response:
        token = chunk.choices[0].delta.content
        if token:
          yield token

    except Exception as e:
      yield f"Error encountered during local inference: {str(e)}"

  return StreamingResponse(stream_tokens(), media_type="text/plain")
