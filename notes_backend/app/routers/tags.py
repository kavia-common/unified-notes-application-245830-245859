from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.deps import get_current_user, get_db
from app.schemas import TagsListResponse

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get(
    "",
    response_model=TagsListResponse,
    summary="List tags",
    description="Lists all tags for the current user, sorted by name.",
)
def list_tags(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)) -> TagsListResponse:
    """Return all tag names for current user."""
    user_id = current_user["id"]
    rows = db.execute(
        text("SELECT name FROM tag WHERE user_id = :user_id ORDER BY name"),
        {"user_id": user_id},
    ).mappings().all()
    return TagsListResponse(tags=[r["name"] for r in rows])
