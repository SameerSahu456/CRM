from typing import List, Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    DATABASE_URL: str = "postgresql+asyncpg://localhost:5432/zenith_crm"
    SECRET_KEY: str = "change-me-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    # Allow configuration via environment variable (comma-separated URLs)
    # Default includes localhost and common Vercel pattern
    CORS_ORIGINS_STR: Optional[str] = None
    DEBUG: bool = False
    API_PREFIX: str = "/api"

    @property
    def CORS_ORIGINS(self) -> List[str]:
        """Parse CORS origins from environment variable or use defaults"""
        if self.CORS_ORIGINS_STR:
            # Split by comma and strip whitespace
            return [origin.strip() for origin in self.CORS_ORIGINS_STR.split(",")]
        # Default origins for local development
        return [
            "http://localhost:3000",
            "http://localhost:5173",
        ]


settings = Settings()
