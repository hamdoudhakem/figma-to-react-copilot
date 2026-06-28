from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import generator

app = FastAPI(title=settings.APP_NAME)

# Crucial for local Next.js communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include our upcoming generation route
app.include_router(generator.router, prefix="/api")


@app.get("/health")
def health_check():
  return {"status": "healthy", "model_configured": settings.LLM_MODEL}
