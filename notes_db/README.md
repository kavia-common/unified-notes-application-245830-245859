# notes_db (PostgreSQL)

PostgreSQL schema + migrations for the Retro Notes full-stack app.

## What this container provides

Tables:

- `app_user`: users (email/password hash)
- `auth_session`: auth sessions (bearer token sessions)
- `note`: notes (owned by user)
- `tag`: tags (owned by user)
- `note_tag`: many-to-many relation between notes and tags (per-user)

Indexes:

- Per-user isolation via composite/foreign keys + indexes on `(user_id, ...)`
- Search support:
  - fast partial search on title/content via GIN index on `to_tsvector('english', title || ' ' || content)`

## Applying migrations

This repo includes plain SQL migration files under `migrations/`.

Run them in order against your Postgres database, e.g.:

```bash
psql "$POSTGRES_URL" -v ON_ERROR_STOP=1 -f migrations/001_init.sql
psql "$POSTGRES_URL" -v ON_ERROR_STOP=1 -f seeds/001_dev_seed.sql
```

Where `POSTGRES_URL` is a standard `postgresql://user:pass@host:port/dbname` connection string.

## Notes for backend integration

- Backend should enforce user isolation by always scoping queries with `WHERE user_id = $current_user_id`.
- Use the `note_search_tsv` generated column + `@@ plainto_tsquery(...)` for search.
- Tags are unique per user (`UNIQUE (user_id, name)`).

Task completed: Added notes_db container with documentation and SQL migration/seed structure.
