import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    """Application configuration loaded from environment variables."""

    postgres_url: str
    auth_token_secret: str
    auth_token_ttl_hours: int
    cors_origins: list[str]


def _parse_cors_origins(raw: str | None) -> list[str]:
    if not raw:
        return []
    return [p.strip() for p in raw.split(",") if p.strip()]


# PUBLIC_INTERFACE
def get_settings() -> Settings:
    """Load and validate settings from environment variables.

    Returns:
        Settings: Immutable settings object.

    Raises:
        RuntimeError: If required environment variables are missing.
    """
    postgres_url = os.getenv("POSTGRES_URL", "").strip()
    if not postgres_url:
        raise RuntimeError("Missing required env var POSTGRES_URL")

    auth_token_secret = os.getenv("AUTH_TOKEN_SECRET", "").strip()
    if not auth_token_secret:
        raise RuntimeError("Missing required env var AUTH_TOKEN_SECRET")

    ttl_raw = os.getenv("AUTH_TOKEN_TTL_HOURS", "168").strip()
    try:
        ttl = int(ttl_raw)
    except ValueError as e:
        raise RuntimeError("AUTH_TOKEN_TTL_HOURS must be an integer") from e

    cors_origins = _parse_cors_origins(os.getenv("CORS_ORIGINS"))

    return Settings(
        postgres_url=postgres_url,
        auth_token_secret=auth_token_secret,
        auth_token_ttl_hours=ttl,
        cors_origins=cors_origins,
    )
