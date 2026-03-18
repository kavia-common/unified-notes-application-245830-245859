import base64
import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone

from passlib.context import CryptContext

from app.core.config import get_settings

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# PUBLIC_INTERFACE
def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt."""
    return _pwd_context.hash(password)


# PUBLIC_INTERFACE
def verify_password(password: str, password_hash: str) -> bool:
    """Verify a plaintext password against its stored hash."""
    try:
        return _pwd_context.verify(password, password_hash)
    except Exception:
        return False


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _b64url_decode(data: str) -> bytes:
    pad = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + pad)


# PUBLIC_INTERFACE
def create_bearer_token(user_id: str) -> tuple[str, datetime]:
    """Create an HMAC-signed bearer token.

    Token format: v1.<payload_b64url>.<sig_b64url>
    Payload is: "<user_id>:<exp_unix_seconds>:<nonce>"

    Returns:
        tuple[str, datetime]: (token, expires_at)
    """
    settings = get_settings()
    ttl = timedelta(hours=settings.auth_token_ttl_hours)
    expires_at = datetime.now(timezone.utc) + ttl
    exp = int(expires_at.timestamp())
    nonce = _b64url(os.urandom(16))
    payload = f"{user_id}:{exp}:{nonce}".encode("utf-8")
    payload_b64 = _b64url(payload)

    sig = hmac.new(
        settings.auth_token_secret.encode("utf-8"),
        msg=payload_b64.encode("utf-8"),
        digestmod=hashlib.sha256,
    ).digest()
    sig_b64 = _b64url(sig)
    return f"v1.{payload_b64}.{sig_b64}", expires_at


# PUBLIC_INTERFACE
def verify_bearer_token(token: str) -> dict | None:
    """Verify a bearer token and return claims.

    Returns:
        dict | None: {user_id: str, exp: int} if valid, else None.
    """
    settings = get_settings()
    try:
        parts = token.split(".")
        if len(parts) != 3 or parts[0] != "v1":
            return None
        payload_b64 = parts[1]
        sig_b64 = parts[2]

        expected_sig = hmac.new(
            settings.auth_token_secret.encode("utf-8"),
            msg=payload_b64.encode("utf-8"),
            digestmod=hashlib.sha256,
        ).digest()
        if not hmac.compare_digest(_b64url(expected_sig), sig_b64):
            return None

        payload = _b64url_decode(payload_b64).decode("utf-8")
        user_id, exp_str, _nonce = payload.split(":", 2)
        exp = int(exp_str)
        now = int(datetime.now(timezone.utc).timestamp())
        if now >= exp:
            return None
        return {"user_id": user_id, "exp": exp}
    except Exception:
        return None


# PUBLIC_INTERFACE
def hash_token_for_storage(token: str) -> str:
    """Hash a bearer token for storage in auth_session.token_hash (defense in depth)."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
