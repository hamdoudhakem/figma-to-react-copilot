from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

if not settings.DATABASE_URL:
  raise ValueError("DATABASE_URL environment variable is missing!")

# Async engine configured cleanly for cloud PostgreSQL pooling
engine = create_async_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # Discards stale or dropped connections automatically
    pool_size=5,
    max_overflow=10,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)


class Base(DeclarativeBase):
  pass

# Dependency injection for API route endpoints


async def get_db():
  async with AsyncSessionLocal() as session:
    try:
      yield session
    finally:
      await session.close()
