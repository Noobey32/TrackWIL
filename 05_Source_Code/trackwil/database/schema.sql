-- TrackWIL database schema (SQLite)
-- Project: TrackWIL - Work-Integrated Learning logbook tracking
-- Group: Group 3 (SPM622)
--
-- Four tables in third normal form:
--   users                 one row per account (student, coordinator, lecturer)
--   wil_placements        one row per WIL placement; belongs to one student and
--                         holds the hours that placement requires
--   logbook_entries       one row per day of WIL work; belongs to one placement
--   verification_tokens   one-time mentor links; each belongs to one entry
--
-- A student can complete several WIL placements, so an entry is linked to its
-- placement and reaches the student through it (no student_id on the entry).
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
    password_hash   TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS wil_placements (
    id              TEXT    PRIMARY KEY,
    student_id      TEXT    NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    title           TEXT    NOT NULL,
    company_name    TEXT    NOT NULL,
    required_hours  REAL    NOT NULL CHECK (required_hours > 0 AND required_hours <= 5000),
    start_date      TEXT    NOT NULL,
    created_at      TEXT    NOT NULL,
    updated_at      TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wil_placements_student
    ON wil_placements (student_id, start_date DESC);

CREATE TABLE IF NOT EXISTS logbook_entries (
    id                  TEXT    PRIMARY KEY,
    placement_id        TEXT    NOT NULL REFERENCES wil_placements (id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_logbook_entries_placement
    ON logbook_entries (placement_id, work_date DESC);

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
