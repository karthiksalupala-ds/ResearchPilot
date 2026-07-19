from pydantic_settings import BaseSettings
from functools import lru_cache
from pydantic import Field


class Settings(BaseSettings):
    # LLM
    groq_api_key: str = ""
    openai_api_key: str = ""
    openrouter_api_key: str = Field(default="")
    google_api_key: str = Field(default="")
    serper_api_key: str = Field(default="")
    huggingface_api_token: str = Field(default="")

    llm_provider: str = "gemini"  # Gemini is free and fast
    llm_model: str = "llama-3.1-8b-instant"  # Fast Groq model for when Groq is used
    embedding_provider: str = "huggingface"

    # Supabase
    supabase_url: str = ""
    supabase_service_key: str = ""

    # Research APIs
    semantic_scholar_api_key: str = ""
    ncbi_api_key: str = ""
    core_api_key: str = ""
    contact_email: str = "researchpilot@example.com"  # For polite pool headers

    # App
    demo_mode: bool = False
    frontend_url: str = "http://localhost:5173"

    class Config:
        env_file = ".env"
        extra = "ignore"

    @property
    def is_demo(self) -> bool:
        """Auto-enable demo mode if no LLM key is configured."""
        if self.demo_mode:
            return True
        has_llm_key = any([
            self.groq_api_key,
            self.openai_api_key,
            self.openrouter_api_key,
            self.google_api_key,
        ])
        return not has_llm_key


@lru_cache()
def get_settings() -> Settings:
    return Settings()
