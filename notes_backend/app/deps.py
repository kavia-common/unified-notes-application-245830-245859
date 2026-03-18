from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.security import verify_bearer_token
from app.db.session import get_db_session


def _get_auth_header_token(request: Request) -> str | None:
    auth = request.headers.get("authorization") or request.headers.get("Authorization")
    if not auth:
        return None
    parts = auth.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    return parts[1].strip() or None


# PUBLIC_INTERFACE
def get_db() -> Session:
    """FastAPI dependency that yields a DB session per request."""
    db = get_db_session()
    try:
        yield db
    finally:
        db.close()


# PUBLIC_INTERFACE
def get_current_user(request: Request, db: Session = Depends(get_db)) -> dict:
    """FastAPI dependency to authenticate requests via Bearer token.

    Returns:
        dict: {id: str, email: str}

    Raises:
        HTTPException: 401 when missing/invalid/expired token, or session not found.
    """
    token = _get_auth_header_token(request)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    claims = verify_bearer_token(token)
    if not claims:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    # Ensure session exists and not expired in DB (server-side revocation)
    row = db.execute(
        text(
            """
            SELECT u.id::text AS id, u.email AS email
            FROM auth_session s
            JOIN app_user u ON u.id = s.user_id
            WHERE s.token_hash = :token_hash
              AND s.expires_at > now()
            """
        ),
        {"token_hash": __import__("hashlib").sha256(token.encode("utf-8")).hexdigest()},
    ).mappings().first()

    if not row:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session not found or expired")

    return {"id": row["id"], "email": row["email"], "token": token}
