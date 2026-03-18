from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.security import (
    create_bearer_token,
    hash_password,
    hash_token_for_storage,
    verify_password,
)
from app.deps import get_current_user, get_db
from app.schemas import AuthTokenResponse, LoginRequest, SignupRequest, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/signup",
    response_model=AuthTokenResponse,
    status_code=201,
    summary="Create an account",
    description="Create a new user account, then returns a bearer token session.",
)
def signup(payload: SignupRequest, db: Session = Depends(get_db)) -> AuthTokenResponse:
    """Create a new user and session.

    Args:
        payload: SignupRequest with email/password.
        db: Database session.

    Returns:
        AuthTokenResponse: token and user.
    """
    email = payload.email.strip().lower()
    pw_hash = hash_password(payload.password)

    try:
        row = db.execute(
            text(
                """
                INSERT INTO app_user (email, password_hash)
                VALUES (:email, :password_hash)
                RETURNING id::text AS id, email
                """
            ),
            {"email": email, "password_hash": pw_hash},
        ).mappings().first()
        if not row:
            raise HTTPException(status_code=500, detail="Failed to create user")
        user_id = row["id"]
    except Exception:
        # likely unique violation on email
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already in use")

    token, expires_at = create_bearer_token(user_id)
    db.execute(
        text(
            """
            INSERT INTO auth_session (user_id, token_hash, expires_at)
            VALUES (:user_id, :token_hash, :expires_at)
            """
        ),
        {"user_id": user_id, "token_hash": hash_token_for_storage(token), "expires_at": expires_at},
    )
    db.commit()

    return AuthTokenResponse(token=token, user=UserResponse(id=user_id, email=email))


@router.post(
    "/login",
    response_model=AuthTokenResponse,
    summary="Login",
    description="Login with email/password and receive a bearer token session.",
)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthTokenResponse:
    """Login and create a new session."""
    email = payload.email.strip().lower()
    user = db.execute(
        text("SELECT id::text AS id, email, password_hash FROM app_user WHERE email = :email"),
        {"email": email},
    ).mappings().first()

    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token, expires_at = create_bearer_token(user["id"])
    db.execute(
        text(
            """
            INSERT INTO auth_session (user_id, token_hash, expires_at)
            VALUES (:user_id, :token_hash, :expires_at)
            """
        ),
        {"user_id": user["id"], "token_hash": hash_token_for_storage(token), "expires_at": expires_at},
    )
    db.commit()

    return AuthTokenResponse(token=token, user=UserResponse(id=user["id"], email=user["email"]))


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user",
    description="Returns the authenticated user's profile.",
)
def me(current_user: dict = Depends(get_current_user)) -> UserResponse:
    """Return current user info from the authenticated session."""
    return UserResponse(id=current_user["id"], email=current_user["email"])


@router.post(
    "/logout",
    status_code=204,
    summary="Logout",
    description="Deletes the current bearer token session.",
)
def logout(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)) -> None:
    """Logout by removing the current session row in auth_session."""
    token = current_user["token"]
    db.execute(
        text("DELETE FROM auth_session WHERE token_hash = :token_hash"),
        {"token_hash": hash_token_for_storage(token)},
    )
    db.commit()
    return None
