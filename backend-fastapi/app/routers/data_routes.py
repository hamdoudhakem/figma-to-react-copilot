from fastapi import APIRouter, Header, HTTPException
from typing import Optional
from sqlalchemy import select, or_, desc
from app.core.database import AsyncSessionLocal
from app.models.db_models import DBComponent, DBAuditLog

router = APIRouter()

# Matches GET /api/components (when prefixed with /api in main.py)


@router.get("/components")
async def get_components(x_session_id: Optional[str] = Header(None)):
  session_id = x_session_id or "PORTFOLIO_SEED"

  async with AsyncSessionLocal() as session:
    try:
      stmt = (
          select(DBComponent)
          .where(or_(
              DBComponent.session_id == session_id,
              DBComponent.session_id == "PORTFOLIO_SEED"
          ))
          .order_by(desc(DBComponent.last_updated))
      )
      result = await session.execute(stmt)
      components = result.scalars().all()

      return [
          {
              "id": comp.id,
              "name": comp.name,
              "figma_url": comp.figma_url,
              "generated_code": comp.generated_code,
              "status": comp.status,
              "session_id": comp.session_id,
              "last_updated": comp.last_updated,
              "user_prompt": comp.user_prompt,
          }
          for comp in components
      ]
    except Exception as e:
      print(f"🔴 [SQLAlchemy GET Components Error]: {str(e)}")
      raise HTTPException(status_code=500, detail=str(e))


@router.get("/logs")
async def get_audit_logs(x_session_id: Optional[str] = Header(None)):
  session_id = x_session_id or "PORTFOLIO_SEED"

  async with AsyncSessionLocal() as session:
    try:
      stmt = (
          select(DBAuditLog)
          .where(or_(
              DBAuditLog.session_id == session_id,
              DBAuditLog.session_id == "PORTFOLIO_SEED"
          ))
          # .order_by(desc(DBAuditLog.timestamp))
          .order_by(DBAuditLog.id.desc())
      )
      result = await session.execute(stmt)
      logs = result.scalars().all()

      return [
          {
              "id": log.id,
              "timestamp": log.timestamp,
              "action": log.action,
              "target_component": log.target_component,
              "duration": log.duration,
              "status": log.status,
              "session_id": log.session_id
          }
          for log in logs
      ]
    except Exception as e:
      print(f"🔴 [SQLAlchemy GET Logs Error]: {str(e)}")
      raise HTTPException(status_code=500, detail=str(e))
