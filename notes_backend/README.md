# notes_backend (FastAPI)

REST API backend for Retro Notes. Provides:

- Auth: signup, login, me, logout (bearer token)
- Notes CRUD: create, update, delete, list with tag filter + full-text search
- Tags: list tags (derived from note_tag relations)

## Environment

See `.env.example`. Required variables:

- `POSTGRES_URL`
- `AUTH_TOKEN_SECRET`

## Run locally

Install dependencies:

```bash
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
```

Start server:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Open API docs:

- Swagger UI: `http://localhost:8000/docs`
- OpenAPI: `http://localhost:8000/openapi.json`

## Frontend integration

Frontend expects:

- `NEXT_PUBLIC_API_BASE=http://localhost:8000`
- Sends `Authorization: Bearer <token>` header

## Database

This backend uses the schema in `../notes_db/migrations/001_init.sql`.
Ensure migrations are applied before running the backend.
