/**
 * @file lib/audit.ts
 * @description Modul untuk pencatatan log audit dan riwayat status dokumen.
 * Digunakan untuk melacak setiap aksi user dan perubahan status surat masuk secara otomatis.
 */
// lib/audit.ts
import { prisma } from "./prisma";
import { Prisma, DocumentStatus } from "@prisma/client";

interface AuditParams {
  userId: string;
  suratMasukId?: string;
  action: string;
  description?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

export async function createAuditLog(params: AuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        suratMasukId: params.suratMasukId,
        action: params.action,
        description: params.description,
        metadata: (params.metadata ?? {}) as Prisma.InputJsonValue,
        ipAddress: params.ipAddress,
      },
    });
  } catch (error) {
    // Audit log tidak boleh break flow utama
    console.error("[AuditLog Error]", error);
  }
}

export async function createStatusTimeline(params: {
  suratMasukId: string;
  fromStatus: DocumentStatus | string | null;
  toStatus: DocumentStatus | string;
  changedBy: string;
  notes?: string;
}): Promise<void> {
  try {
    await prisma.statusTimeline.create({
      data: {
        suratMasukId: params.suratMasukId,
        fromStatus: params.fromStatus as DocumentStatus | null,
        toStatus: params.toStatus as DocumentStatus,
        changedById: params.changedBy,
        notes: params.notes,
      },
    });
  } catch (error) {
    console.error("[StatusTimeline Error]", error);
  }
}
