-- Seed: 001_dev_seed
-- Purpose: Minimal development seed data.
-- NOTE: Password hashes here are placeholders; backend should create real users via /auth/signup.
-- This seed is optional and intended for local dev only.

BEGIN;

-- Create a demo user with a clearly fake password hash.
INSERT INTO app_user (id, email, password_hash)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'demo@example.com',
    'dev_only_not_a_real_hash'
)
ON CONFLICT (email) DO NOTHING;

-- Some demo notes
INSERT INTO note (user_id, title, content)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'Welcome to Retro Notes', 'This is a seeded note for local development.'),
    ('11111111-1111-1111-1111-111111111111', 'Tags + Search', 'Try searching for keywords or filtering by tags.');

-- Demo tags
INSERT INTO tag (user_id, name)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'retro'),
    ('11111111-1111-1111-1111-111111111111', 'ideas'),
    ('11111111-1111-1111-1111-111111111111', 'work')
ON CONFLICT (user_id, name) DO NOTHING;

-- Link first note to retro
INSERT INTO note_tag (user_id, note_id, tag_id)
SELECT
    n.user_id,
    n.id AS note_id,
    t.id AS tag_id
FROM note n
JOIN tag t
  ON t.user_id = n.user_id
WHERE n.user_id = '11111111-1111-1111-1111-111111111111'
  AND n.title = 'Welcome to Retro Notes'
  AND t.name = 'retro'
ON CONFLICT DO NOTHING;

COMMIT;
