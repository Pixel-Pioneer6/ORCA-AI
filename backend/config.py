import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "ORCA Marine Intelligence Multi-Agent API"
    APP_VERSION: str = "2.8.4-PRO"
    API_PREFIX: str = "/api"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ]
    
    # Optional LLM API Keys (Supports Gemini & OpenAI, gracefully falls back to deterministic rule engine if unset)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # Default Maritime Anchor: Kasimedu Pier, Chennai
    DEFAULT_LAT: float = 13.12
    DEFAULT_LON: float = 80.30
    DEFAULT_ZONE: str = "SEC-04 (Chennai North Bight)"
    
    # Hydrodynamic Safety Clamp Thresholds
    DEFAULT_SAFE_LOA_RATIO: float = 0.18  # Safe SWH ~ 18% of craft LOA (8.2m boat = ~1.47m SWH)
    MAX_EXCEEDANCE_PERCENT_MARGIN: float = 0.15  # 15% exceedance triggers CAUTION

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
