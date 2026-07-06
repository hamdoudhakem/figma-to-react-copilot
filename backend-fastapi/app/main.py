from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import engine, Base
from app.routers import generator, data_routes  # Added data_routes import


@asynccontextmanager
async def lifespan(app: FastAPI):
  async with engine.begin() as conn:
    await conn.run_sync(Base.metadata.create_all)
  yield

app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Active Endpoints Matrix
app.include_router(generator.router, prefix="/api")
app.include_router(data_routes.router, prefix="/api")


@app.get("/health")
def health_check():
  return {"status": "healthy", "model_configured": settings.LLM_MODEL}
