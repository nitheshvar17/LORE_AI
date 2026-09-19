import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "LORE — Institutional Memory for GitLab"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"
    
    # AI Provider Settings
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "demo")  # demo, openai, gemini, anthropic
    AI_API_KEY: str = os.getenv("AI_API_KEY", "")
    AI_MODEL: str = os.getenv("AI_MODEL", "lore-deterministic-v1")
    
    # Database Settings (SQLite default for instant local setup, Postgres ready)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./lore.db")
    
    # GitLab Integration Settings
    GITLAB_URL: str = os.getenv("GITLAB_URL", "https://gitlab.com")
    GITLAB_TOKEN: str = os.getenv("GITLAB_TOKEN", "")
    GITLAB_PROJECT_ID: str = os.getenv("GITLAB_PROJECT_ID", "lore-project/core")
    GITLAB_WEBHOOK_SECRET: str = os.getenv("GITLAB_WEBHOOK_SECRET", "lore-webhook-secret-token")
    
    # Security & CORS
    CORS_ORIGINS: List[str] = ["*"]
    SECRET_KEY: str = os.getenv("SECRET_KEY", "lore-secret-key-3day-hackathon-2026")

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
