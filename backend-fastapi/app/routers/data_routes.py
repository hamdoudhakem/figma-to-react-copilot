from fastapi import APIRouter, Depends
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.db_models import DBComponent, DBAuditLog

router = APIRouter()


@router.get("/components")
async def get_all_components(db: AsyncSession = Depends(get_db)):
  """REST Endpoint: Supplies all generated components for the Dashboard view"""
  result = await db.execute(select(DBComponent))
  return result.scalars().all()


@router.get("/logs")
async def get_all_logs(db: AsyncSession = Depends(get_db)):
  """REST Endpoint: Supplies system telemetry logs for the Audit History table"""
  result = await db.execute(select(DBAuditLog))
  return result.scalars().all()
