import httpx
from fastapi import APIRouter, Header
from sqlalchemy import select, func
from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.models.db_models import DBAuditLog, DBComponent

router = APIRouter()


@router.get("/api/analytics/stats")
async def get_system_analytics_dashboard(x_session_id: str | None = Header(None)):
  session_id = x_session_id or "PORTFOLIO_SEED"

  ollama_status = "OFFLINE"
  # Ping the local running core server directly to inspect model connection state
  try:
    async with httpx.AsyncClient(timeout=1.5) as client:
      response = await client.get("http://127.0.0.1:11434/api/tags")
      if response.status_code == 200:
        ollama_status = "ONLINE"
  except Exception:
    ollama_status = "OFFLINE"

  async with AsyncSessionLocal() as session:
    # 1. Gather all logs matching active execution pipelines
    stmt_logs = select(DBAuditLog).order_by(DBAuditLog.id.desc()).limit(8)
    logs_res = await session.execute(stmt_logs)
    logs_list = logs_res.scalars().all()

    # 2. Total generation statistics aggregations
    stmt_total = select(func.count(DBAuditLog.id))
    total_res = await session.execute(stmt_total)
    total_count = total_res.scalar() or 0

    # Success metrics
    stmt_success = select(func.count(DBAuditLog.id)).where(DBAuditLog.status == "SUCCESS")
    success_res = await session.execute(stmt_success)
    success_count = success_res.scalar() or 0

    # Error metrics
    stmt_error = select(func.count(DBAuditLog.id)).where(DBAuditLog.status == "ERROR")
    error_res = await session.execute(stmt_error)
    error_count = error_res.scalar() or 0

    # Cancelled metrics
    stmt_cancel = select(func.count(DBAuditLog.id)).where(DBAuditLog.status == "CANCELLED")
    cancel_res = await session.execute(stmt_cancel)
    cancel_count = cancel_res.scalar() or 0

    # 3. Calculate mean average execution runtime
    stmt_all_success = select(DBAuditLog.duration).where(DBAuditLog.status == "SUCCESS")
    all_success_res = await session.execute(stmt_all_success)
    durations = all_success_res.scalars().all()

    avg_duration = 0.0
    if durations:
      try:
        # Strips out trailing "s" characters appended during telemetry logging
        clean_durations = [float(d.replace("s", "")) for d in durations if d]
        if clean_durations:
          avg_duration = sum(clean_durations) / len(clean_durations)
      except Exception:
        avg_duration = 0.0

    return {
        "ollamaStatus": ollama_status,
        "modelName": settings.LLM_MODEL,
        "totalGenerations": total_count,
        "successCount": success_count,
        "failedCount": error_count,
        "cancelledCount": cancel_count,
        "avgDurationSec": avg_duration,
        "activeSessionId": session_id,
        "recentLogs": [
            {
                "id": log.id,
                "action": log.action,
                "target_component": log.target_component,
                "duration": log.duration,
                "status": log.status,
                "timestamp": log.timestamp,
            }
            for log in logs_list
        ]
    }
