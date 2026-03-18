from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.deps import get_current_user, get_db
from app.schemas import NoteResponse, NoteUpsertRequest, NotesListResponse

router = APIRouter(prefix="/notes", tags=["notes"])


def _normalize_tags(tags: list[str]) -> list[str]:
    norm = []
    for t in tags:
        tt = t.strip().lower()
        if tt:
            norm.append(tt)
    # unique preserve order
    seen: set[str] = set()
    out: list[str] = []
    for t in norm:
        if t in seen:
            continue
        seen.add(t)
        out.append(t)
    return out


def _fetch_note_tags(db: Session, user_id: str, note_id: str) -> list[str]:
    rows = db.execute(
        text(
            """
            SELECT t.name
            FROM note_tag nt
            JOIN tag t ON t.id = nt.tag_id
            WHERE nt.user_id = :user_id
              AND nt.note_id = :note_id
            ORDER BY t.name
            """
        ),
        {"user_id": user_id, "note_id": note_id},
    ).mappings().all()
    return [r["name"] for r in rows]


@router.get(
    "",
    response_model=NotesListResponse,
    summary="List notes",
    description="List notes for the current user. Supports full-text search (q) and tag filter.",
)
def list_notes(
    q: str | None = Query(default=None, description="Full-text search query (title + content)."),
    tag: str | None = Query(default=None, description="Filter by tag name."),
    limit: int = Query(default=100, ge=1, le=200, description="Max notes to return."),
    offset: int = Query(default=0, ge=0, le=10000, description="Pagination offset."),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> NotesListResponse:
    """List notes scoped to the authenticated user."""
    user_id = current_user["id"]

    params: dict = {"user_id": user_id, "limit": limit, "offset": offset}
    where = ["n.user_id = :user_id"]
    join = ""

    if tag:
        join = "JOIN note_tag nt ON nt.note_id = n.id AND nt.user_id = n.user_id JOIN tag t ON t.id = nt.tag_id"
        where.append("t.name = :tag")
        params["tag"] = tag.strip().lower()

    if q and q.strip():
        where.append("n.note_search_tsv @@ plainto_tsquery('english', :q)")
        params["q"] = q.strip()

    sql = f"""
        SELECT n.id::text AS id, n.title, n.content, n.created_at, n.updated_at
        FROM note n
        {join}
        WHERE {" AND ".join(where)}
        ORDER BY n.updated_at DESC
        LIMIT :limit OFFSET :offset
    """

    rows = db.execute(text(sql), params).mappings().all()
    notes: list[NoteResponse] = []
    for r in rows:
        tags = _fetch_note_tags(db, user_id=user_id, note_id=r["id"])
        notes.append(
            NoteResponse(
                id=r["id"],
                title=r["title"],
                content=r["content"],
                tags=tags,
                createdAt=r["created_at"],
                updatedAt=r["updated_at"],
            )
        )
    return NotesListResponse(notes=notes)


@router.post(
    "",
    response_model=NoteResponse,
    status_code=201,
    summary="Create note",
    description="Create a note with optional tags (tags are created per-user as needed).",
)
def create_note(
    payload: NoteUpsertRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> NoteResponse:
    """Create a note for the current user."""
    user_id = current_user["id"]
    tags = _normalize_tags(payload.tags)

    row = db.execute(
        text(
            """
            INSERT INTO note (user_id, title, content)
            VALUES (:user_id, :title, :content)
            RETURNING id::text AS id, title, content, created_at, updated_at
            """
        ),
        {"user_id": user_id, "title": payload.title.strip() or "Untitled", "content": payload.content},
    ).mappings().first()
    if not row:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create note")

    note_id = row["id"]

    # Upsert tags then link in note_tag
    for name in tags:
        trow = db.execute(
            text(
                """
                INSERT INTO tag (user_id, name)
                VALUES (:user_id, :name)
                ON CONFLICT (user_id, name) DO UPDATE SET name = EXCLUDED.name
                RETURNING id::text AS id
                """
            ),
            {"user_id": user_id, "name": name},
        ).mappings().first()
        if not trow:
            continue
        db.execute(
            text(
                """
                INSERT INTO note_tag (user_id, note_id, tag_id)
                VALUES (:user_id, :note_id, :tag_id)
                ON CONFLICT DO NOTHING
                """
            ),
            {"user_id": user_id, "note_id": note_id, "tag_id": trow["id"]},
        )

    db.commit()

    return NoteResponse(
        id=note_id,
        title=row["title"],
        content=row["content"],
        tags=_fetch_note_tags(db, user_id=user_id, note_id=note_id),
        createdAt=row["created_at"],
        updatedAt=row["updated_at"],
    )


@router.put(
    "/{note_id}",
    response_model=NoteResponse,
    summary="Update note",
    description="Update note title/content and replace its tag set.",
)
def update_note(
    note_id: str,
    payload: NoteUpsertRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> NoteResponse:
    """Update a note owned by the current user."""
    user_id = current_user["id"]
    tags = _normalize_tags(payload.tags)

    row = db.execute(
        text(
            """
            UPDATE note
            SET title = :title,
                content = :content,
                updated_at = now()
            WHERE id = :note_id
              AND user_id = :user_id
            RETURNING id::text AS id, title, content, created_at, updated_at
            """
        ),
        {"note_id": note_id, "user_id": user_id, "title": payload.title.strip() or "Untitled", "content": payload.content},
    ).mappings().first()

    if not row:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")

    # Replace tags: delete existing relations then insert new
    db.execute(
        text("DELETE FROM note_tag WHERE user_id = :user_id AND note_id = :note_id"),
        {"user_id": user_id, "note_id": note_id},
    )

    for name in tags:
        trow = db.execute(
            text(
                """
                INSERT INTO tag (user_id, name)
                VALUES (:user_id, :name)
                ON CONFLICT (user_id, name) DO UPDATE SET name = EXCLUDED.name
                RETURNING id::text AS id
                """
            ),
            {"user_id": user_id, "name": name},
        ).mappings().first()
        if not trow:
            continue
        db.execute(
            text(
                """
                INSERT INTO note_tag (user_id, note_id, tag_id)
                VALUES (:user_id, :note_id, :tag_id)
                ON CONFLICT DO NOTHING
                """
            ),
            {"user_id": user_id, "note_id": note_id, "tag_id": trow["id"]},
        )

    db.commit()

    return NoteResponse(
        id=row["id"],
        title=row["title"],
        content=row["content"],
        tags=_fetch_note_tags(db, user_id=user_id, note_id=note_id),
        createdAt=row["created_at"],
        updatedAt=row["updated_at"],
    )


@router.delete(
    "/{note_id}",
    status_code=204,
    summary="Delete note",
    description="Delete a note owned by the current user.",
)
def delete_note(
    note_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Delete a note (scoped to user)."""
    user_id = current_user["id"]
    res = db.execute(
        text("DELETE FROM note WHERE id = :note_id AND user_id = :user_id"),
        {"note_id": note_id, "user_id": user_id},
    )
    if res.rowcount == 0:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    db.commit()
    return None
