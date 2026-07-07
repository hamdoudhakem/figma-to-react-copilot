from sqlalchemy import String, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
import uuid
from app.core.database import Base


class DBComponent(Base):
  __tablename__ = "components"

  id: Mapped[str] = mapped_column(String(50), primary_key=True, default=lambda: f"comp-{uuid.uuid4().hex[:6]}")
  name: Mapped[str] = mapped_column(String(255), nullable=False)
  figma_url: Mapped[str] = mapped_column(Text, nullable=False)
  generated_code: Mapped[str] = mapped_column(Text, nullable=True)
  status: Mapped[str] = mapped_column(String(50), default="SYNCED")
  last_updated: Mapped[str] = mapped_column(String(50), default=lambda: datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"))
  # Added to match your SQL migration layer
  session_id: Mapped[str] = mapped_column(String(255), default="PORTFOLIO_SEED", nullable=False)


class DBAuditLog(Base):
  __tablename__ = "audit_logs"

  id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
  timestamp: Mapped[str] = mapped_column(String(50), default=lambda: datetime.now().strftime("%H:%M:%S"))
  action: Mapped[str] = mapped_column(String(255), nullable=False)
  target_component: Mapped[str] = mapped_column(String(255), nullable=False)
  duration: Mapped[str] = mapped_column(String(50), nullable=False)
  status: Mapped[str] = mapped_column(String(50), default="SUCCESS")
  # Added to match your SQL migration layer
  session_id: Mapped[str] = mapped_column(String(255), default="PORTFOLIO_SEED", nullable=False)
