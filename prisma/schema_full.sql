-- ================================================================
-- SCHEMA SQL LENGKAP — SISTEM INFORMASI ALUR SURAT PDAM
-- Database  : PostgreSQL 14+
-- Versi     : 1.0.0
-- Dibuat    : 2025
-- ================================================================
-- CARA MENJALANKAN FILE INI:
--   psql -U postgres -d pdam_surat_db -f schema.sql
-- ================================================================


-- ────────────────────────────────────────────────────────────────
-- 0. EKSTENSI
-- ────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";    -- untuk gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";     -- untuk pencarian LIKE cepat


-- ────────────────────────────────────────────────────────────────
-- 1. HAPUS OBJEK LAMA (aman untuk re-run)
-- ────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS status_timeline     CASCADE;
DROP TABLE IF EXISTS audit_logs          CASCADE;
DROP TABLE IF EXISTS archives            CASCADE;
DROP TABLE IF EXISTS handover_logs       CASCADE;
DROP TABLE IF EXISTS director_decisions  CASCADE;
DROP TABLE IF EXISTS document_reviews    CASCADE;
DROP TABLE IF EXISTS document_files      CASCADE;
DROP TABLE IF EXISTS documents           CASCADE;
DROP TABLE IF EXISTS users               CASCADE;

DROP TYPE IF EXISTS "UserRole"        CASCADE;
DROP TYPE IF EXISTS "DocumentStatus"  CASCADE;
DROP TYPE IF EXISTS "DecisionType"    CASCADE;
DROP TYPE IF EXISTS "FileType"        CASCADE;
DROP TYPE IF EXISTS "ReviewStatus"    CASCADE;
DROP TYPE IF EXISTS "HandoverStatus"  CASCADE;

DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
DROP FUNCTION IF EXISTS fn_audit_document_status CASCADE;


-- ────────────────────────────────────────────────────────────────
-- 2. ENUM TYPES
-- ────────────────────────────────────────────────────────────────

-- Role pengguna
CREATE TYPE "UserRole" AS ENUM (
  'STAFF',        -- Admin Bagian / Staff pembuat surat
  'AGENDARIS',    -- Agendaris pemeriksa dokumen
  'DIREKTUR',     -- Direktur Utama pengambil keputusan
  'ADMIN'         -- Administrator sistem
);

-- Status perjalanan dokumen (10 tahap)
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

-- Jenis keputusan Direktur
CREATE TYPE "DecisionType" AS ENUM (
  'DISETUJUI',
  'DITOLAK',
  'REVISI',
  'DISPOSISI'
);

-- Tipe file yang dilampirkan
CREATE TYPE "FileType" AS ENUM (
  'DRAFT',        -- File draft awal dari Staff
  'FINAL_SCAN',   -- Scan dokumen fisik final
  'ATTACHMENT'    -- Lampiran tambahan
);

-- Status review oleh Agendaris
CREATE TYPE "ReviewStatus" AS ENUM (
  'DITERUSKAN',   -- Dokumen diteruskan ke Direktur
  'DIKEMBALIKAN'  -- Dokumen dikembalikan ke Staff
);

-- Status serah terima fisik dokumen
CREATE TYPE "HandoverStatus" AS ENUM (
  'MENUNGGU',      -- Menunggu konfirmasi Staff
  'DIKONFIRMASI'   -- Staff sudah ambil surat fisik
);


-- ────────────────────────────────────────────────────────────────
-- 3. TABEL: users
-- ────────────────────────────────────────────────────────────────
CREATE TABLE users (
  id            TEXT         NOT NULL DEFAULT gen_random_uuid()::TEXT,
  name          VARCHAR(150) NOT NULL,
  email         VARCHAR(255) NOT NULL,
  password_hash TEXT         NOT NULL,
  role          "UserRole"   NOT NULL,
  divisi        VARCHAR(100),
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_users        PRIMARY KEY (id),
  CONSTRAINT uq_users_email  UNIQUE (email),
  CONSTRAINT chk_email_fmt   CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

-- Indeks untuk login dan filter role
CREATE INDEX idx_users_email     ON users (email);
CREATE INDEX idx_users_role      ON users (role);
CREATE INDEX idx_users_is_active ON users (is_active);

COMMENT ON TABLE  users             IS 'Data pengguna sistem SIPAS PDAM';
COMMENT ON COLUMN users.role        IS 'STAFF=Admin Bagian, AGENDARIS=Agendaris, DIREKTUR=Direktur Utama, ADMIN=Administrator';
COMMENT ON COLUMN users.is_active   IS 'Soft delete: FALSE = nonaktif, tidak bisa login';


-- ────────────────────────────────────────────────────────────────
-- 4. TABEL: documents
-- ────────────────────────────────────────────────────────────────
CREATE TABLE documents (
  id              TEXT             NOT NULL DEFAULT gen_random_uuid()::TEXT,
  nomor_surat     VARCHAR(150)     NOT NULL,
  perihal         VARCHAR(500)     NOT NULL,
  deskripsi       TEXT,
  tujuan          VARCHAR(300),
  tanggal_surat   DATE             NOT NULL,
  current_status  "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
  current_holder  TEXT,                          -- user_id atau label role pemegang
  created_by      TEXT             NOT NULL,
  created_at      TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ      NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_documents             PRIMARY KEY (id),
  CONSTRAINT uq_documents_nomor_surat UNIQUE (nomor_surat),
  CONSTRAINT fk_documents_created_by  FOREIGN KEY (created_by)
    REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX idx_documents_status     ON documents (current_status);
CREATE INDEX idx_documents_created_by ON documents (created_by);
CREATE INDEX idx_documents_nomor      ON documents (nomor_surat);
CREATE INDEX idx_documents_updated    ON documents (updated_at DESC);
-- Indeks GiST untuk pencarian teks (memerlukan pg_trgm)
CREATE INDEX idx_documents_perihal_trgm   ON documents USING GIN (perihal   gin_trgm_ops);
CREATE INDEX idx_documents_nomor_trgm     ON documents USING GIN (nomor_surat gin_trgm_ops);

COMMENT ON TABLE  documents                IS 'Data utama surat/dokumen yang diproses';
COMMENT ON COLUMN documents.nomor_surat    IS 'Nomor surat unik, contoh: 001/ADM/PDAM/2025';
COMMENT ON COLUMN documents.current_status IS 'Status terkini dalam alur dokumen';
COMMENT ON COLUMN documents.current_holder IS 'Pemegang dokumen saat ini (user_id atau label AGENDARIS/DIREKTUR/ADMIN)';


-- ────────────────────────────────────────────────────────────────
-- 5. TABEL: document_files
-- ────────────────────────────────────────────────────────────────
CREATE TABLE document_files (
  id           TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  document_id  TEXT        NOT NULL,
  file_type    "FileType"  NOT NULL,
  file_name    VARCHAR(255) NOT NULL,
  file_path    TEXT        NOT NULL,
  file_size    INTEGER     CHECK (file_size > 0),   -- bytes
  mime_type    VARCHAR(100),
  uploaded_by  TEXT        NOT NULL,
  uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_document_files            PRIMARY KEY (id),
  CONSTRAINT fk_doc_files_document        FOREIGN KEY (document_id)
    REFERENCES documents (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_doc_files_uploaded_by     FOREIGN KEY (uploaded_by)
    REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_mime_type                CHECK (
    mime_type IN ('application/pdf','image/jpeg','image/jpg','image/png')
  )
);

CREATE INDEX idx_doc_files_document ON document_files (document_id);
CREATE INDEX idx_doc_files_type     ON document_files (file_type);
CREATE INDEX idx_doc_files_uploaded ON document_files (uploaded_at DESC);

COMMENT ON TABLE document_files IS 'File lampiran dokumen: draft awal atau scan final';


-- ────────────────────────────────────────────────────────────────
-- 6. TABEL: document_reviews  (Agendaris → review kelengkapan)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE document_reviews (
  id            TEXT           NOT NULL DEFAULT gen_random_uuid()::TEXT,
  document_id   TEXT           NOT NULL,
  reviewed_by   TEXT           NOT NULL,
  review_note   TEXT,
  review_status "ReviewStatus" NOT NULL,
  reviewed_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_document_reviews        PRIMARY KEY (id),
  CONSTRAINT fk_reviews_document        FOREIGN KEY (document_id)
    REFERENCES documents (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_reviews_reviewed_by     FOREIGN KEY (reviewed_by)
    REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX idx_reviews_document    ON document_reviews (document_id);
CREATE INDEX idx_reviews_reviewed_at ON document_reviews (reviewed_at DESC);

COMMENT ON TABLE document_reviews IS 'Riwayat review Agendaris: diteruskan atau dikembalikan';


-- ────────────────────────────────────────────────────────────────
-- 7. TABEL: director_decisions  (Direktur → keputusan)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE director_decisions (
  id            TEXT           NOT NULL DEFAULT gen_random_uuid()::TEXT,
  document_id   TEXT           NOT NULL,
  director_id   TEXT           NOT NULL,
  decision_type "DecisionType" NOT NULL,
  decision_note TEXT,
  decided_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_director_decisions      PRIMARY KEY (id),
  CONSTRAINT fk_decisions_document      FOREIGN KEY (document_id)
    REFERENCES documents (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_decisions_director      FOREIGN KEY (director_id)
    REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX idx_decisions_document   ON director_decisions (document_id);
CREATE INDEX idx_decisions_director   ON director_decisions (director_id);
CREATE INDEX idx_decisions_decided_at ON director_decisions (decided_at DESC);

COMMENT ON TABLE director_decisions IS 'Keputusan Direktur: disetujui, ditolak, revisi, atau disposisi';


-- ────────────────────────────────────────────────────────────────
-- 8. TABEL: handover_logs  (Agendaris → Staff: pengambilan fisik)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE handover_logs (
  id                  TEXT             NOT NULL DEFAULT gen_random_uuid()::TEXT,
  document_id         TEXT             NOT NULL,
  staff_id            TEXT             NOT NULL,
  agendaris_id        TEXT             NOT NULL,
  handover_time       TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  confirmation_status "HandoverStatus" NOT NULL DEFAULT 'MENUNGGU',
  confirmed_at        TIMESTAMPTZ,
  notes               TEXT,

  CONSTRAINT pk_handover_logs           PRIMARY KEY (id),
  CONSTRAINT fk_handover_document       FOREIGN KEY (document_id)
    REFERENCES documents (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_handover_staff          FOREIGN KEY (staff_id)
    REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_handover_agendaris      FOREIGN KEY (agendaris_id)
    REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_confirmed_at           CHECK (
    (confirmation_status = 'DIKONFIRMASI' AND confirmed_at IS NOT NULL)
    OR (confirmation_status = 'MENUNGGU')
  )
);

CREATE INDEX idx_handover_document ON handover_logs (document_id);
CREATE INDEX idx_handover_staff    ON handover_logs (staff_id);

COMMENT ON TABLE handover_logs IS 'Log serah terima surat fisik dari Agendaris ke Staff';


-- ────────────────────────────────────────────────────────────────
-- 9. TABEL: archives  (Admin → pengarsipan final)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE archives (
  id               TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  document_id      TEXT        NOT NULL,
  archived_by      TEXT        NOT NULL,
  server_location  TEXT,                  -- path/direktori penyimpanan server
  archived_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes            TEXT,

  CONSTRAINT pk_archives             PRIMARY KEY (id),
  CONSTRAINT uq_archives_document    UNIQUE (document_id),   -- 1 dokumen = 1 arsip
  CONSTRAINT fk_archives_document    FOREIGN KEY (document_id)
    REFERENCES documents (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_archives_archived_by FOREIGN KEY (archived_by)
    REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX idx_archives_document    ON archives (document_id);
CREATE INDEX idx_archives_archived_by ON archives (archived_by);
CREATE INDEX idx_archives_archived_at ON archives (archived_at DESC);

COMMENT ON TABLE archives IS 'Arsip final dokumen yang sudah selesai diproses secara penuh';


-- ────────────────────────────────────────────────────────────────
-- 10. TABEL: audit_logs  (Jejak semua aktivitas pengguna)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE audit_logs (
  id          TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  user_id     TEXT        NOT NULL,
  document_id TEXT,                      -- NULL jika tidak terkait dokumen
  action      VARCHAR(100) NOT NULL,     -- contoh: DOCUMENT_CREATED, REVIEW_DITERUSKAN
  description TEXT,
  metadata    JSONB,                     -- data tambahan (flexible)
  ip_address  VARCHAR(50),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_audit_logs         PRIMARY KEY (id),
  CONSTRAINT fk_audit_user         FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_audit_document     FOREIGN KEY (document_id)
    REFERENCES documents (id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX idx_audit_user       ON audit_logs (user_id);
CREATE INDEX idx_audit_document   ON audit_logs (document_id);
CREATE INDEX idx_audit_created_at ON audit_logs (created_at DESC);
CREATE INDEX idx_audit_action     ON audit_logs (action);
-- Indeks JSONB untuk query metadata
CREATE INDEX idx_audit_metadata   ON audit_logs USING GIN (metadata);

COMMENT ON TABLE audit_logs IS 'Trail audit seluruh aktivitas pengguna dalam sistem';


-- ────────────────────────────────────────────────────────────────
-- 11. TABEL: status_timeline  (Tracking perubahan status dokumen)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE status_timeline (
  id           TEXT             NOT NULL DEFAULT gen_random_uuid()::TEXT,
  document_id  TEXT             NOT NULL,
  from_status  "DocumentStatus",           -- NULL jika status pertama (DRAFT)
  to_status    "DocumentStatus" NOT NULL,
  changed_by   TEXT             NOT NULL,  -- user_id yang melakukan perubahan
  notes        TEXT,
  created_at   TIMESTAMPTZ      NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_status_timeline        PRIMARY KEY (id),
  CONSTRAINT fk_timeline_document      FOREIGN KEY (document_id)
    REFERENCES documents (id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX idx_timeline_document   ON status_timeline (document_id);
CREATE INDEX idx_timeline_created_at ON status_timeline (created_at ASC);

COMMENT ON TABLE status_timeline IS 'Riwayat lengkap perubahan status setiap dokumen';


-- ────────────────────────────────────────────────────────────────
-- 12. TRIGGERS — Auto-update kolom updated_at
-- ────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk tabel users
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger untuk tabel documents
CREATE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ────────────────────────────────────────────────────────────────
-- 13. VIEWS — Untuk query yang sering digunakan
-- ────────────────────────────────────────────────────────────────

-- View: dokumen dengan info lengkap pembuat dan status
CREATE OR REPLACE VIEW vw_documents_summary AS
SELECT
  d.id,
  d.nomor_surat,
  d.perihal,
  d.tujuan,
  d.tanggal_surat,
  d.current_status,
  d.created_at,
  d.updated_at,
  u.name          AS creator_name,
  u.email         AS creator_email,
  u.divisi        AS creator_divisi,
  u.role          AS creator_role,
  -- Jumlah file terlampir
  (SELECT COUNT(*) FROM document_files df WHERE df.document_id = d.id)
    AS file_count,
  -- Keputusan terakhir Direktur
  (SELECT dd.decision_type FROM director_decisions dd
   WHERE dd.document_id = d.id ORDER BY dd.decided_at DESC LIMIT 1)
    AS last_decision,
  -- Sudah diarsipkan?
  EXISTS (SELECT 1 FROM archives a WHERE a.document_id = d.id)
    AS is_archived
FROM documents d
JOIN users u ON u.id = d.created_by;

COMMENT ON VIEW vw_documents_summary IS 'Ringkasan dokumen dengan info pembuat dan statistik';


-- View: statistik dokumen per status
CREATE OR REPLACE VIEW vw_status_stats AS
SELECT
  current_status,
  COUNT(*)                              AS total,
  MIN(created_at)                       AS oldest,
  MAX(updated_at)                       AS latest_update
FROM documents
GROUP BY current_status
ORDER BY total DESC;

COMMENT ON VIEW vw_status_stats IS 'Jumlah dokumen per status untuk monitoring Admin';


-- View: antrian arsip (dokumen siap diarsipkan)
CREATE OR REPLACE VIEW vw_arsip_queue AS
SELECT
  d.id,
  d.nomor_surat,
  d.perihal,
  d.tanggal_surat,
  d.updated_at                          AS siap_arsip_sejak,
  u.name                                AS creator_name,
  u.divisi                              AS creator_divisi,
  dd.decision_type                      AS keputusan_direktur,
  dd.decision_note,
  dd.decided_at,
  dir.name                              AS nama_direktur,
  -- File scan final tersedia?
  EXISTS (
    SELECT 1 FROM document_files df
    WHERE df.document_id = d.id AND df.file_type = 'FINAL_SCAN'
  )                                     AS has_final_scan
FROM documents d
JOIN users u   ON u.id  = d.created_by
LEFT JOIN director_decisions dd
  ON dd.document_id = d.id
  AND dd.decided_at = (
    SELECT MAX(dd2.decided_at) FROM director_decisions dd2
    WHERE dd2.document_id = d.id
  )
LEFT JOIN users dir ON dir.id = dd.director_id
WHERE d.current_status = 'MENUNGGU_ARSIP_ADMIN'
ORDER BY d.updated_at ASC;

COMMENT ON VIEW vw_arsip_queue IS 'Antrian dokumen menunggu pengarsipan oleh Admin';


-- ────────────────────────────────────────────────────────────────
-- 14. STORED PROCEDURES — Operasi database yang sering diulang
-- ────────────────────────────────────────────────────────────────

-- Procedure: Update status dokumen + catat timeline (1 transaksi)
CREATE OR REPLACE FUNCTION fn_update_document_status(
  p_document_id  TEXT,
  p_new_status   "DocumentStatus",
  p_changed_by   TEXT,
  p_holder       TEXT    DEFAULT NULL,
  p_notes        TEXT    DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_old_status "DocumentStatus";
BEGIN
  -- Ambil status lama
  SELECT current_status INTO v_old_status
  FROM documents WHERE id = p_document_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Dokumen dengan id % tidak ditemukan', p_document_id;
  END IF;

  -- Update dokumen
  UPDATE documents
  SET
    current_status = p_new_status,
    current_holder = COALESCE(p_holder, current_holder),
    updated_at     = NOW()
  WHERE id = p_document_id;

  -- Catat timeline
  INSERT INTO status_timeline (
    document_id, from_status, to_status, changed_by, notes
  ) VALUES (
    p_document_id, v_old_status, p_new_status, p_changed_by, p_notes
  );

END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_update_document_status IS
  'Update status dokumen dan catat perubahan ke status_timeline dalam satu transaksi';


-- Procedure: Catat audit log
CREATE OR REPLACE FUNCTION fn_add_audit_log(
  p_user_id     TEXT,
  p_action      VARCHAR(100),
  p_description TEXT    DEFAULT NULL,
  p_document_id TEXT    DEFAULT NULL,
  p_metadata    JSONB   DEFAULT NULL,
  p_ip_address  VARCHAR DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id, document_id, action, description, metadata, ip_address
  ) VALUES (
    p_user_id, p_document_id, p_action, p_description, p_metadata, p_ip_address
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_add_audit_log IS 'Helper untuk insert audit log';


-- ────────────────────────────────────────────────────────────────
-- 15. DATA AWAL (SEED)
-- ────────────────────────────────────────────────────────────────
-- ⚠️  Password sudah di-hash dengan bcrypt (salt=12)
--     Password asli tercantum di komentar tiap baris
--     GANTI hash ini setelah deploy ke production!

-- Hapus data lama jika ada (untuk re-seed)
DELETE FROM status_timeline;
DELETE FROM audit_logs;
DELETE FROM archives;
DELETE FROM handover_logs;
DELETE FROM director_decisions;
DELETE FROM document_reviews;
DELETE FROM document_files;
DELETE FROM documents;
DELETE FROM users;

-- Insert Users
-- Admin       password: Admin@12345
INSERT INTO users (id, name, email, password_hash, role, divisi) VALUES
  ('usr-admin-001',
   'Super Admin',
   'admin@pdam.go.id',
   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewFHMrXJX7EGhqK2',
   'ADMIN',
   'IT / Sistem Informasi');

-- Staff       password: Staff@12345
INSERT INTO users (id, name, email, password_hash, role, divisi) VALUES
  ('usr-staff-001',
   'Budi Santoso',
   'staff@pdam.go.id',
   '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uHSSuh/2XO',
   'STAFF',
   'Administrasi Umum');

-- Agendaris   password: Agendaris@12345
INSERT INTO users (id, name, email, password_hash, role, divisi) VALUES
  ('usr-agendaris-001',
   'Sari Dewi Rahayu',
   'agendaris@pdam.go.id',
   '$2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p362PElHDsFEYoHcPAXGXi',
   'AGENDARIS',
   'Sekretariat');

-- Direktur    password: Direktur@12345
INSERT INTO users (id, name, email, password_hash, role, divisi) VALUES
  ('usr-direktur-001',
   'Ir. H. Ahmad Subagyo, M.T.',
   'direktur@pdam.go.id',
   '$2b$12$2iRUniYSB0kFWYsaHMKjKeUGTNGRkMDHHnf0k8Kuh7lP0EHnNp7W2',
   'DIREKTUR',
   'Direksi');

-- Contoh dokumen awal
INSERT INTO documents (
  id, nomor_surat, perihal, deskripsi, tujuan,
  tanggal_surat, current_status, created_by, current_holder
) VALUES (
  'doc-sample-001',
  '001/ADM/PDAM/2025',
  'Permohonan Pengadaan Peralatan Kantor',
  'Surat permohonan pengadaan komputer, printer, dan ATK untuk kebutuhan operasional Q1 2025.',
  'Direktur Utama PDAM Kabupaten Bandung',
  '2025-01-15',
  'DRAFT',
  'usr-staff-001',
  'usr-staff-001'
);

-- Timeline awal dokumen
INSERT INTO status_timeline (document_id, from_status, to_status, changed_by, notes)
VALUES (
  'doc-sample-001',
  NULL,
  'DRAFT',
  'usr-staff-001',
  'Dokumen dibuat oleh Staff'
);

-- Audit log awal
INSERT INTO audit_logs (user_id, document_id, action, description)
VALUES (
  'usr-admin-001',
  NULL,
  'SYSTEM_INIT',
  'Database SIPAS PDAM berhasil diinisialisasi dan di-seed'
);


-- ────────────────────────────────────────────────────────────────
-- 16. VERIFIKASI AKHIR
-- ────────────────────────────────────────────────────────────────

-- Tampilkan ringkasan hasil
DO $$
DECLARE
  v_users    INT;
  v_docs     INT;
  v_tables   INT;
BEGIN
  SELECT COUNT(*) INTO v_users  FROM users;
  SELECT COUNT(*) INTO v_docs   FROM documents;
  SELECT COUNT(*) INTO v_tables
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

  RAISE NOTICE '========================================';
  RAISE NOTICE '  SIPAS PDAM — Setup Selesai';
  RAISE NOTICE '========================================';
  RAISE NOTICE '  Tabel dibuat   : %', v_tables;
  RAISE NOTICE '  User seed      : %', v_users;
  RAISE NOTICE '  Dokumen sample : %', v_docs;
  RAISE NOTICE '========================================';
  RAISE NOTICE '  Akun Default:';
  RAISE NOTICE '  Admin     → admin@pdam.go.id     / Admin@12345';
  RAISE NOTICE '  Staff     → staff@pdam.go.id     / Staff@12345';
  RAISE NOTICE '  Agendaris → agendaris@pdam.go.id / Agendaris@12345';
  RAISE NOTICE '  Direktur  → direktur@pdam.go.id  / Direktur@12345';
  RAISE NOTICE '========================================';
END $$;
