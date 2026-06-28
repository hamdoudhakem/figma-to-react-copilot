from openai import OpenAI
from app.core.config import settings

# Unified client works perfectly with Ollama, Groq, or OpenAI
llm_client = OpenAI(
    base_url=settings.LLM_BASE_URL,
    api_key=settings.LLM_API_KEY
)
