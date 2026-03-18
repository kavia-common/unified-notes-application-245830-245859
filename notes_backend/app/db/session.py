from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings

_engine: Engine | None = None
_SessionLocal: sessionmaker | None = None


def _init_engine() -> None:
    global _engine, _SessionLocal
    if _engine is not None and _SessionLocal is not None:
        return
    settings = get_settings()
    _engine = create_engine(settings.postgres_url, pool_pre_ping=True)
    _SessionLocal = sessionmaker(bind=_engine, autocommit=False, autoflush=False)


# PUBLIC_INTERFACE
def get_db_session() -> Session:
    """Create a new SQLAlchemy session for a request scope.

    Caller is responsible for closing the session.

    Returns:
        Session: SQLAlchemy session connected to the configured Postgres database.
    """
    _init_engine()
    assert _SessionLocal is not None
    return _SessionLocal()
