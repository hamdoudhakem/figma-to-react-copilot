from datetime import datetime, timezone
import time
import asyncio
from fastapi import APIRouter, HTTPException, Depends, Header
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select  # Used to safely locate existing records

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

    # Phase A: Run MCP Fetch (Unchanged)
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
          figma_url=request.figma_url,
          session_id=session_id
      ))
      return

    # Phase B: Prompt Assembly & Token Streaming (Unchanged)
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
        token = chunk.choices[0].delta.content if chunk.choices else None
        if token:
          accumulated_code += token
          yield token
          await asyncio.sleep(0.005)

    except GeneratorExit:
      # Catch client disconnects (tabs closed mid-stream) so we can log partial code
      execution_status = "CANCELLED"
      raise
    except Exception as e:
      execution_status = "ERROR"
      yield f"⚠️ [LLM Streaming Error]: {str(e)}"
    finally:
      # Phase C: Automation Pipeline (Upgraded for complete logging transparency)
      await asyncio.shield(record_telemetry(
          start_time=start_time,
          target=file_key or "Unknown Component",
          action="GENERATE_REACT_COMPONENT",
          status=execution_status,
          code_snapshot=accumulated_code,
          figma_url=request.figma_url,
          session_id=session_id
      ))

  return StreamingResponse(stream_tokens_and_automate_save(), media_type="text/plain")


async def record_telemetry(start_time, target, action, status, code_snapshot="", figma_url=None, session_id="PORTFOLIO_SEED"):
  """Automated Database Writer with Smart Upserting and Global State Sync."""
  duration = f"{(time.perf_counter() - start_time):.2f}s"
  current_time_str = datetime.now().astimezone().strftime("%Y-%m-%d %H:%M:%S")

  async with AsyncSessionLocal() as session:
    try:
      # 1. Always write an operational audit tracking log
      log_entry = DBAuditLog(
          action=action,
          target_component=target,
          duration=duration,
          status=status,
          session_id=session_id
      )
      session.add(log_entry)

      # 2. Synchronize the component state if a Figma URL is present
      if figma_url:
        component_name = f"Sync-{target[:8]}"

        # Check if a record already exists for this URL within the active session
        stmt = select(DBComponent).where(
            DBComponent.figma_url == figma_url,
            DBComponent.session_id == session_id
        )
        query_result = await session.execute(stmt)
        existing_component = query_result.scalars().first()

        if existing_component:
          print(f"🔄 [Telemetry Sync]: Updating existing asset record: {existing_component.id} -> Status: {status}")
          existing_component.name = component_name
          # Update the code if it succeeded, or keep old code if a brand new run threw an error
          if status == "SUCCESS" or code_snapshot:
            existing_component.generated_code = code_snapshot
          existing_component.status = "SYNCED" if status == "SUCCESS" else status
          existing_component.last_updated = current_time_str
        else:
          print(f"🆕 [Telemetry Sync]: Creating a fresh tracking definition row -> Status: {status}")
          new_component = DBComponent(
              name=component_name,
              figma_url=figma_url,
              generated_code=code_snapshot,
              status="SYNCED" if status == "SUCCESS" else status,
              last_updated=current_time_str,
              session_id=session_id
          )
          session.add(new_component)

      await session.commit()
      print(f"🍏 [Telemetry Sync]: Successfully flushed transactional updates for session {session_id}")
    except Exception as e:
      await session.rollback()
      print(f"🔴 [Telemetry DB Error]: {str(e)}")
