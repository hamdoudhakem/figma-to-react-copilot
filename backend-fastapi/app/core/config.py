import os
from pathlib import Path
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[2]
ENV_PATH = BACKEND_DIR / ".env"
load_dotenv(dotenv_path=ENV_PATH)


class Settings(BaseSettings):
  APP_NAME: str = "Figma Copilot API"

  # LLM Settings
  LLM_BASE_URL: str = os.getenv("LLM_BASE_URL", "http://localhost:11434/v1")
  LLM_API_KEY: str = os.getenv("LLM_API_KEY", "ollama-local-token")
  LLM_MODEL: str = os.getenv("LLM_MODEL", "qwen2.5-coder:7b")

  # Figma Configuration
  FIGMA_ACCESS_TOKEN: str = os.getenv("FIGMA_ACCESS_TOKEN", "")

  # Cloud Database Link
  DATABASE_URL: str = os.getenv("DATABASE_URL", "")


settings = Settings()
