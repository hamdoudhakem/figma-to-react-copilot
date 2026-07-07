from datetime import datetime, timezone
import time
import asyncio
from fastapi import APIRouter, HTTPException, Depends, Header
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.llm import llm_client
from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.services.mcp_client import fetch_figma_node_data, parse_figma_url
from app.models.db_models import DBComponent, DBAuditLog

router = APIRouter()


class GenerationRequest(BaseModel):
  figma_url: str
  prompt_override: str | None = None


def unpack_exception_message(e: Exception) -> str:
  """Recursively unpacks Python 3.11+ ExceptionGroups to expose the true root cause."""
  if hasattr(e, "exceptions") and e.exceptions:
    return " | ".join(unpack_exception_message(sub_e) for sub_e in e.exceptions)
  return str(e)


@router.post("/generate")
async def generate_component(
    request: GenerationRequest,
    x_session_id: str | None = Header(None)
):
  if not request.figma_url:
    raise HTTPException(status_code=400, detail="Figma workspace canvas URL is required.")

  session_id = x_session_id or "PORTFOLIO_SEED"

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
      clean_error_msg = unpack_exception_message(e)
      yield f"⚠️ [MCP Error]: {clean_error_msg}"

      await asyncio.shield(record_telemetry(
          start_time=start_time,
          target=file_key or "Unknown",
          action="MCP_EXTRACTION_FAILED",
          status=execution_status,
          code_snapshot="",
          session_id=session_id
      ))
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

      for chunk in response:
        token = chunk.choices[0].delta.content
        if token:
          accumulated_code += token
          yield token
          await asyncio.sleep(0.005)

    except Exception as e:
      execution_status = "ERROR"
      yield f"⚠️ [LLM Streaming Error]: {str(e)}"
    finally:
      # Phase C: Automation Pipeline
      await asyncio.shield(record_telemetry(
          start_time=start_time,
          target=file_key or "Unknown Component",
          action="GENERATE_REACT_COMPONENT",
          status=execution_status,
          code_snapshot=accumulated_code if execution_status == "SUCCESS" else None,
          figma_url=request.figma_url,
          session_id=session_id
      ))

  return StreamingResponse(stream_tokens_and_automate_save(), media_type="text/plain")


async def record_telemetry(start_time, target, action, status, code_snapshot=None, figma_url=None, session_id="PORTFOLIO_SEED"):
  """Automated Database Writer with safe explicit transaction lifecycle management."""
  duration = f"{(time.perf_counter() - start_time):.2f}s"
  current_time_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

  async with AsyncSessionLocal() as session:
    try:
      log_entry = DBAuditLog(
          action=action,
          target_component=target,
          duration=duration,
          status=status,
          session_id=session_id
      )
      session.add(log_entry)

      if status == "SUCCESS" and code_snapshot:
        component_name = f"Sync-{target[:8]}"
        new_component = DBComponent(
            name=component_name,
            figma_url=figma_url or "Direct API Trigger",
            generated_code=code_snapshot,
            status="SYNCED",
            last_updated=current_time_str,
            session_id=session_id
        )
        session.add(new_component)

      await session.commit()
      print(f"🍏 [Telemetry Sync]: Saved successfully for session {session_id}")
    except Exception as e:
      await session.rollback()
      print(f"🔴 [Telemetry DB Error]: {str(e)}")
