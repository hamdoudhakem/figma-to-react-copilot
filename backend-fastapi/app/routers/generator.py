import time
import asyncio
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.llm import llm_client
from app.core.config import settings
from app.core.database import AsyncSessionLocal  # Direct session maker for background safety
from app.services.mcp_client import fetch_figma_node_data, parse_figma_url
from app.models.db_models import DBComponent, DBAuditLog

router = APIRouter()


class GenerationRequest(BaseModel):
  figma_url: str
  prompt_override: str | None = None


@router.post("/generate")
async def generate_component(request: GenerationRequest):
  """
  Core REST Streaming Endpoint: 
  1. Leverages an MCP client server connection to fetch structural Figma layouts.
  2. Pipes node trees to a generative LLM model.
  3. Streams UI code back token-by-token.
  4. Automatically records code updates and telemetry histories to Supabase.
  """
  if not request.figma_url:
    raise HTTPException(status_code=400, detail="Figma workspace canvas URL is required.")

  # Pre-parse URL to catch basic errors early before spinning up servers
  file_key, _ = parse_figma_url(request.figma_url)
  if not file_key:
    raise HTTPException(status_code=400, detail="Malformed Figma URL. Unable to isolate file key.")

  async def stream_tokens_and_automate_save():
    start_time = time.perf_counter()
    accumulated_code = ""
    execution_status = "SUCCESS"
    figma_json_str = "{}"

    # Phase A: Run MCP Fetch
    try:
      figma_json_str = await fetch_figma_node_data(request.figma_url)
    except Exception as e:
      execution_status = "ERROR"
      # Yield error details to the UI stream so the developer sees what failed
      yield f"⚠️ [MCP Error]: {str(e)}"
      await record_telemetry(start_time, file_key or "Unknown", "MCP_EXTRACTION_FAILED", execution_status, "")
      return

    # Phase B: Prompt Assembly & Token Streaming
    try:
      system_prompt = (
          "You are an elite Frontend Engineer expert in React and Tailwind CSS.\n"
          "Your objective is to convert a structural Figma JSON tree into high-fidelity React code.\n"
          "Requirements:\n"
          "1. Return ONLY executable React component code.\n"
          "2. Apply responsive layouts using Tailwind utility classes exclusively.\n"
          "3. Do NOT provide markdown explanations, introductory sentences, or summary paragraphs.\n"
          "4. Output must start immediately with imports and export a default component named 'App'.\n"
      )

      user_content = f"Here is the clean structural Figma design node payload:\n```json\n{figma_json_str}\n```\n"
      if request.prompt_override:
        user_content += f"Additional user instructions: {request.prompt_override}\n"

      # Execute non-blocking thread-pool completion execution
      loop = asyncio.get_event_loop()
      response = await loop.run_in_executor(
          None,
          lambda: llm_client.chat.completions.create(
              model=settings.LLM_MODEL,
              messages=[
                  {"role": "system", "content": system_prompt},
                  {"role": "user", "content": user_content}
              ],
              stream=True,
              temperature=0.1
          )
      )

      # Read token streams and push directly to client network pipe
      for chunk in response:
        token = chunk.choices[0].delta.content
        if token:
          accumulated_code += token
          yield token
          # Tiny sleep loop ensures steady frame pacing across concurrent requests
          await asyncio.sleep(0.005)

    except Exception as e:
      execution_status = "ERROR"
      yield f"⚠️ [LLM Streaming Error]: {str(e)}"
    finally:
      # Phase C: Automation Pipeline (Commit records cleanly to Cloud Database)
      await record_telemetry(
          start_time=start_time,
          target=file_key or "Unknown Component",
          action="GENERATE_REACT_COMPONENT",
          status=execution_status,
          code_snapshot=accumulated_code if execution_status == "SUCCESS" else None,
          figma_url=request.figma_url
      )

  return StreamingResponse(stream_tokens_and_automate_save(), media_type="text/plain")


async def record_telemetry(start_time, target, action, status, code_snapshot=None, figma_url=None):
  """Automated Database Writer: Bypasses request lifecycles to ensure log retention."""
  duration = f"{(time.perf_counter() - start_time):.2f}s"

  async with AsyncSessionLocal() as session:
    async with session.begin():
      # 1. Append System Audit Metric
      log_entry = DBAuditLog(
          action=action,
          target_component=target,
          duration=duration,
          status=status
      )
      session.add(log_entry)

      # 2. Append or Register New Live Component to Dashboard if successful
      if status == "SUCCESS" and code_snapshot:
        new_component = DBComponent(
            name=f"Sync-{target[:8]}",
            figma_url=figma_url or "Direct API Trigger",
            generated_code=code_snapshot,
            status="SYNCED"
        )
        session.add(new_component)

      await session.commit()
