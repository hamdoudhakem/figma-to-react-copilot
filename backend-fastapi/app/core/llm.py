from openai import OpenAI
from app.core.config import settings

# Unified asynchronous-ready client wrapper
llm_client = OpenAI(
    base_url=settings.LLM_BASE_URL,
    api_key=settings.LLM_API_KEY
)
