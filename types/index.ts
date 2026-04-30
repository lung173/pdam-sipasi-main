// types/index.ts
// Central type definitions untuk seluruh sistem

import {
  UserRole,
  DocumentStatus,
  DecisionType,
  FileType,
  ReviewStatus,
} from "@prisma/client";

export type { UserRole, DocumentStatus, DecisionType, FileType, ReviewStatus };

// ─────────────────────────────────────────────
//  USER TYPES
// ─────────────────────────────────────────────

export interface UserPayload {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  divisi?: string | null;
}

export interface UserSession extends UserPayload {
  accessToken?: string;
}

// ─────────────────────────────────────────────
//  DOCUMENT TYPES
// ─────────────────────────────────────────────

export interface DocumentListItem {
  id: string;
  nomorSurat: string;
  perihal: string;
  asalSurat: string | null;
  tanggalSurat: Date | string;
  currentStatus: DocumentStatus;
  createdAt: Date | string;
  createdBy: {
    id: string;
    name: string;
    divisi: string | null;
  };
}

export interface DocumentDetail extends DocumentListItem {
  files: DocumentFileItem[];
  reviews: ReviewItem[];
  decisions: DecisionItem[];
  statusTimeline: TimelineItem[];
  archive: ArchiveItem | null;
  jadwalDirekturs?: JadwalItem[];
  disposisi?: DisposisiItem[];
  undangan?: UndanganItem | null;
}

export interface DocumentFileItem {
  id: string;
  fileType: FileType;
  fileName: string;
  filePath: string;
  fileSize: number | null;
  mimeType: string | null;
  uploadedAt: Date | string;
  uploadedBy: { name: string };
}

export interface ReviewItem {
  id: string;
  reviewNote: string | null;
  reviewStatus: ReviewStatus;
  reviewedAt: Date | string;
  reviewedBy: { name: string };
}

export interface DecisionItem {
  id: string;
  decisionType: DecisionType;
  decisionNote: string | null;
  tempat: string | null;
  tanggalTandaTangan: Date | string | null;
  parafDirektur: string | null;
  decidedAt: Date | string;
  director: { name: string };
}

export interface TimelineItem {
  id: string;
  fromStatus: DocumentStatus | null;
  toStatus: DocumentStatus;
  changedBy: string; // Changed back to just string or object
  notes: string | null;
  createdAt: Date | string;
}

export interface ArchiveItem {
  id: string;
  serverLocation: string | null;
  archivedAt: Date | string;
  archivedBy: { name: string };
  bulan: number;
  tahun: number;
}

export interface JadwalItem {
  id: string;
  jadwalKirim: Date | string;
  isUrgen: boolean;
  isSent: boolean;
  sentAt: Date | string | null;
}

export interface DisposisiItem {
  id: string;
  instruksi: string | null;
  keterangan: string | null;
  tempat: string | null;
  tanggalTandaTangan: Date | string | null;
  parafDariId: string | null;
  dari: { name: string };
  ke: { name: string };
}

export interface UndanganItem {
  id: string;
  hari: string;
  tanggal: Date | string;
  jam: string;
  tempat: string;
  media: string;
  dresscode: string | null;
  catatanLain: string | null;
  deadline: Date | string;
}

// ─────────────────────────────────────────────
//  API RESPONSE TYPES
// ─────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─────────────────────────────────────────────
//  FORM/REQUEST TYPES
// ─────────────────────────────────────────────

export interface CreateDocumentInput {
  nomorSurat: string;
  perihal: string;
  asalSurat?: string;
  tanggalSurat: string; // ISO date string
}

export interface ReviewDocumentInput {
  documentId: string;
  reviewStatus: ReviewStatus;
  reviewNote?: string;
}

export interface DirectorDecisionInput {
  documentId: string;
  decisionType: DecisionType;
  decisionNote?: string;
  tempat?: string;
}

export interface ArchiveDocumentInput {
  documentId: string;
  serverLocation?: string;
  notes?: string;
}

// ─────────────────────────────────────────────
//  STATUS LABEL MAPPING
// ─────────────────────────────────────────────

export const STATUS_LABELS: Record<DocumentStatus, string> = {
  DRAFT: "Draft",
  MENUNGGU_REVIEW_AGENDARIS: "Menunggu Review Agendaris",
  PERLU_REVISI: "Perlu Revisi",
  DIJADWALKAN_KE_DIREKTUR: "Dijadwalkan Ke Direktur",
  MENUNGGU_KEPUTUSAN_DIREKTUR: "Menunggu Keputusan Direktur",
  DIPROSES_DIREKTUR: "Diproses Direktur",
  KEPUTUSAN_DIREKTUR_SELESAI: "Keputusan Direktur Selesai",
  MENUNGGU_PENGAMBILAN_STAFF: "Menunggu Pengambilan Staff",
  MENUNGGU_SCAN_FINAL: "Menunggu Scan Final",
  MENUNGGU_ARSIP_ADMIN: "Menunggu Arsip Admin",
  ARSIP_FINAL_TERSIMPAN: "Arsip Final Tersimpan",
};

export const STATUS_COLORS: Record<DocumentStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  MENUNGGU_REVIEW_AGENDARIS: "bg-yellow-100 text-yellow-800",
  PERLU_REVISI: "bg-red-100 text-red-700",
  DIJADWALKAN_KE_DIREKTUR: "bg-blue-100 text-blue-800",
  MENUNGGU_KEPUTUSAN_DIREKTUR: "bg-indigo-100 text-indigo-800",
  DIPROSES_DIREKTUR: "bg-purple-100 text-purple-800",
  KEPUTUSAN_DIREKTUR_SELESAI: "bg-orange-100 text-orange-800",
  MENUNGGU_PENGAMBILAN_STAFF: "bg-teal-100 text-teal-800",
  MENUNGGU_SCAN_FINAL: "bg-lime-100 text-lime-800",
  MENUNGGU_ARSIP_ADMIN: "bg-cyan-100 text-cyan-800",
  ARSIP_FINAL_TERSIMPAN: "bg-green-100 text-green-800",
};

export const DECISION_LABELS: Record<DecisionType, string> = {
  DISETUJUI: "Disetujui",
  DITOLAK: "Ditolak",
  REVISI: "Perlu Revisi",
  DISPOSISI: "Disposisi",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN_STAFF: "Admin Staff",
  AGENDARIS:   "Agendaris",
  DIREKTUR:    "Direktur Utama",
  KABAG:       "Kepala Bagian",
  KASUBAG:     "Kepala Sub Bagian",
};
