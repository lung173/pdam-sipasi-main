-- ================================================================
-- SCHEMA SQL LENGKAP — SISTEM SURAT PDAM
-- Database: PostgreSQL
-- ================================================================

-- Enable UUID extension (optional, kita pakai cuid via Prisma)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────
--  ENUMS
-- ─────────────────────────────────────────────

CREATE TYPE "UserRole" AS ENUM (
  'STAFF',
  'AGENDARIS',
  'DIREKTUR',
  'ADMIN'
);

CREATE TYPE "DocumentStatus" AS ENUM (
  'DRAFT',
  'MENUNGGU_REVIEW_AGENDARIS',
  'PERLU_REVISI',
  'MENUNGGU_KEPUTUSAN_DIREKTUR',
  'DIPROSES_DIREKTUR',
  'KEPUTUSAN_DIREKTUR_SELESAI',
  'MENUNGGU_PENGAMBILAN_STAFF',
  'MENUNGGU_SCAN_FINAL',
  'MENUNGGU_ARSIP_ADMIN',
  'ARSIP_FINAL_TERSIMPAN'
);

CREATE TYPE "DecisionType" AS ENUM (
  'DISETUJUI',
  'DITOLAK',
  'REVISI',
  'DISPOSISI'
);

CREATE TYPE "FileType" AS ENUM (
  'DRAFT',
  'FINAL_SCAN',
  'ATTACHMENT'
);

CREATE TYPE "ReviewStatus" AS ENUM (
  'DITERUSKAN',
  'DIKEMBALIKAN'
);

CREATE TYPE "HandoverStatus" AS ENUM (
  'MENUNGGU',
  'DIKONFIRMASI'
);

-- ─────────────────────────────────────────────
--  TABLE: users
-- ─────────────────────────────────────────────

CREATE TABLE users (
  id            TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name          TEXT        NOT NULL,
  email         TEXT        NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  role          "UserRole"  NOT NULL,
  divisi        TEXT,
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role  ON users(role);

-- ─────────────────────────────────────────────
--  TABLE: documents
-- ─────────────────────────────────────────────

CREATE TABLE documents (
  id             TEXT             PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  nomor_surat    TEXT             NOT NULL UNIQUE,
  perihal        TEXT             NOT NULL,
  deskripsi      TEXT,
  tujuan         TEXT,
  tanggal_surat  DATE             NOT NULL,
  current_status "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
  current_holder TEXT,
  created_by     TEXT             NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at     TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_documents_status     ON documents(current_status);
CREATE INDEX idx_documents_created_by ON documents(created_by);
CREATE INDEX idx_documents_nomor      ON documents(nomor_surat);

-- ─────────────────────────────────────────────
--  TABLE: document_files
-- ─────────────────────────────────────────────

CREATE TABLE document_files (
  id           TEXT       PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  document_id  TEXT       NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  file_type    "FileType" NOT NULL,
  file_name    TEXT       NOT NULL,
  file_path    TEXT       NOT NULL,
  file_size    INTEGER,
  mime_type    TEXT,
  uploaded_by  TEXT       NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_doc_files_document ON document_files(document_id);
CREATE INDEX idx_doc_files_type     ON document_files(file_type);

-- ─────────────────────────────────────────────
--  TABLE: document_reviews
-- ─────────────────────────────────────────────

CREATE TABLE document_reviews (
  id            TEXT           PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  document_id   TEXT           NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  reviewed_by   TEXT           NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  review_note   TEXT,
  review_status "ReviewStatus" NOT NULL,
  reviewed_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reviews_document ON document_reviews(document_id);

-- ─────────────────────────────────────────────
--  TABLE: director_decisions
-- ─────────────────────────────────────────────

CREATE TABLE director_decisions (
  id            TEXT           PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  document_id   TEXT           NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  director_id   TEXT           NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  decision_type "DecisionType" NOT NULL,
  decision_note TEXT,
  decided_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_decisions_document ON director_decisions(document_id);

-- ─────────────────────────────────────────────
--  TABLE: handover_logs
-- ─────────────────────────────────────────────

CREATE TABLE handover_logs (
  id                  TEXT             PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  document_id         TEXT             NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  staff_id            TEXT             NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  agendaris_id        TEXT             NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  handover_time       TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  confirmation_status "HandoverStatus" NOT NULL DEFAULT 'MENUNGGU',
  confirmed_at        TIMESTAMPTZ,
  notes               TEXT
);

CREATE INDEX idx_handover_document ON handover_logs(document_id);

-- ─────────────────────────────────────────────
--  TABLE: archives
-- ─────────────────────────────────────────────

CREATE TABLE archives (
  id              TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  document_id     TEXT        NOT NULL UNIQUE REFERENCES documents(id) ON DELETE CASCADE,
  archived_by     TEXT        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  server_location TEXT,
  archived_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes           TEXT
);

CREATE INDEX idx_archives_document ON archives(document_id);

-- ─────────────────────────────────────────────
--  TABLE: audit_logs
-- ─────────────────────────────────────────────

CREATE TABLE audit_logs (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id     TEXT        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  document_id TEXT        REFERENCES documents(id) ON DELETE SET NULL,
  action      TEXT        NOT NULL,
  description TEXT,
  metadata    JSONB,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user     ON audit_logs(user_id);
CREATE INDEX idx_audit_document ON audit_logs(document_id);
CREATE INDEX idx_audit_created  ON audit_logs(created_at DESC);

-- ─────────────────────────────────────────────
--  TABLE: status_timeline
-- ─────────────────────────────────────────────

CREATE TABLE status_timeline (
  id          TEXT             PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  document_id TEXT             NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  from_status "DocumentStatus",
  to_status   "DocumentStatus" NOT NULL,
  changed_by  TEXT             NOT NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_timeline_document ON status_timeline(document_id);

-- ─────────────────────────────────────────────
--  AUTO-UPDATE updated_at TRIGGER
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────
--  SEED: Admin default
-- ─────────────────────────────────────────────
-- Password: Admin@12345 (bcrypt hash — ganti via app)
INSERT INTO users (id, name, email, password_hash, role, divisi)
VALUES (
  'seed-admin-001',
  'Super Admin',
  'admin@pdam.go.id',
  '$2b$12$placeholder_hash_replace_via_seed_script',
  'ADMIN',
  'IT'
);
