-- Migration: 001_init
-- Purpose: Core schema for Retro Notes (users, sessions, notes, tags, note-tag relation)
-- Notes:
-- - Designed for per-user isolation (all user-owned tables include user_id).
-- - Includes indexes for fast listing and full-text search across title+content.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users
CREATE TABLE IF NOT EXISTS app_user (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT app_user_email_unique UNIQUE (email)
);

-- Auth sessions (bearer token sessions)
CREATE TABLE IF NOT EXISTS auth_session (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,

    CONSTRAINT auth_session_token_hash_unique UNIQUE (token_hash)
);

CREATE INDEX IF NOT EXISTS idx_auth_session_user_id ON auth_session(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_session_expires_at ON auth_session(expires_at);

-- Notes
CREATE TABLE IF NOT EXISTS note (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Untitled',
    content TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Generated column for full-text search
    note_search_tsv tsvector GENERATED ALWAYS AS (
        to_tsvector(
            'english',
            coalesce(title, '') || ' ' || coalesce(content, '')
        )
    ) STORED
);

-- Typical list / per-user isolation speed-ups
CREATE INDEX IF NOT EXISTS idx_note_user_id_updated_at ON note(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_note_user_id_created_at ON note(user_id, created_at DESC);

-- Full-text search index (scoped by user_id in queries)
CREATE INDEX IF NOT EXISTS idx_note_search_tsv ON note USING GIN (note_search_tsv);

-- Tags (owned by user; unique per user)
CREATE TABLE IF NOT EXISTS tag (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT tag_user_name_unique UNIQUE (user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_tag_user_id ON tag(user_id);
CREATE INDEX IF NOT EXISTS idx_tag_user_id_name ON tag(user_id, name);

-- Note <-> Tag relation
CREATE TABLE IF NOT EXISTS note_tag (
    user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    note_id UUID NOT NULL REFERENCES note(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tag(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    PRIMARY KEY (user_id, note_id, tag_id)
);

-- Accelerate "tags for note" and "notes for tag"
CREATE INDEX IF NOT EXISTS idx_note_tag_user_note ON note_tag(user_id, note_id);
CREATE INDEX IF NOT EXISTS idx_note_tag_user_tag ON note_tag(user_id, tag_id);

COMMIT;
