from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    message: str = Field(..., description="Human-readable error message.")
    details: object | None = Field(default=None, description="Optional error details for debugging.")


class SignupRequest(BaseModel):
    email: Annotated[str, Field(..., description="User email.", min_length=3, max_length=320)]
    password: Annotated[str, Field(..., description="User password (min 6 chars).", min_length=6, max_length=256)]


class LoginRequest(BaseModel):
    email: Annotated[str, Field(..., description="User email.", min_length=3, max_length=320)]
    password: Annotated[str, Field(..., description="User password.", min_length=6, max_length=256)]


class UserResponse(BaseModel):
    id: str = Field(..., description="User id (UUID).")
    email: str = Field(..., description="User email.")


class AuthTokenResponse(BaseModel):
    token: str = Field(..., description="Bearer token. Send as Authorization: Bearer <token>.")
    user: UserResponse | None = Field(default=None, description="Optional user info.")


class NoteUpsertRequest(BaseModel):
    title: Annotated[str, Field(..., description="Note title.", min_length=1, max_length=500)]
    content: Annotated[str, Field(..., description="Note content.", max_length=50000)]
    tags: list[Annotated[str, Field(..., description="Tag name (normalized lowercase).", min_length=1, max_length=64)]] = Field(
        default_factory=list,
        description="Tags for the note.",
        max_length=50,
    )


class NoteResponse(BaseModel):
    id: str = Field(..., description="Note id (UUID).")
    title: str = Field(..., description="Title.")
    content: str = Field(..., description="Content.")
    tags: list[str] = Field(default_factory=list, description="Tags associated with this note.")
    createdAt: datetime | None = Field(default=None, description="Created timestamp (ISO).")
    updatedAt: datetime | None = Field(default=None, description="Updated timestamp (ISO).")


class NotesListResponse(BaseModel):
    notes: list[NoteResponse] = Field(..., description="Notes list.")


class TagsListResponse(BaseModel):
    tags: list[str] = Field(..., description="All tags for current user.")
