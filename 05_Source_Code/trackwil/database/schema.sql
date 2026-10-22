-- TrackWIL database schema (SQLite)
-- Project: TrackWIL - Work-Integrated Learning logbook tracking
-- Group: Group 3 (SPM622)
--
-- Three tables in third normal form:
--   users                 one row per account (student, coordinator, lecturer)
--   logbook_entries       one row per day of WIL work; belongs to one student
--   verification_tokens   one-time mentor links; each belongs to one entry
--
-- Mentors do not have accounts. They verify through a token link, so the
-- mentor is recorded only as an email address on the entry.
--
-- Timestamps are ISO-8601 UTC strings (e.g. 2026-10-22T08:00:00.000Z), which
-- sort correctly as text and match the format the application writes.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
    id              TEXT    PRIMARY KEY,
    full_name       TEXT    NOT NULL,
    email           TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    role            TEXT    NOT NULL CHECK (role IN ('student', 'coordinator', 'lecturer')),
    password_hash   TEXT    NOT NULL,
    required_hours  REAL    NOT NULL DEFAULT 0 CHECK (required_hours >= 0)
);

CREATE TABLE IF NOT EXISTS logbook_entries (
    id                  TEXT    PRIMARY KEY,
    student_id          TEXT    NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    work_date           TEXT    NOT NULL,
    description         TEXT    NOT NULL,
    hours               REAL    NOT NULL CHECK (hours > 0 AND hours <= 24),
    evidence_file_name  TEXT    UNIQUE,
    status              TEXT    NOT NULL DEFAULT 'draft'
                                CHECK (status IN ('draft', 'pending_verification', 'verified', 'rejected')),
    mentor_email        TEXT,
    created_at          TEXT    NOT NULL,
    updated_at          TEXT    NOT NULL,
    verified_at         TEXT
);

CREATE INDEX IF NOT EXISTS idx_logbook_entries_student
    ON logbook_entries (student_id, work_date DESC);

CREATE TABLE IF NOT EXISTS verification_tokens (
    token       TEXT    PRIMARY KEY,
    entry_id    TEXT    NOT NULL REFERENCES logbook_entries (id) ON DELETE CASCADE,
    expires_at  TEXT    NOT NULL,
    used_at     TEXT,
    decision    TEXT    CHECK (decision IN ('approved', 'rejected')),
    -- A token is either unused (no decision) or used (with a decision).
    CHECK ((used_at IS NULL) = (decision IS NULL))
);

CREATE INDEX IF NOT EXISTS idx_verification_tokens_entry
    ON verification_tokens (entry_id);
