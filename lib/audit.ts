/**
 * @file lib/audit.ts
 * @description Modul untuk pencatatan log audit dan riwayat status dokumen.
 * Digunakan untuk melacak setiap aksi user dan perubahan status surat masuk secara otomatis.
 */
// lib/audit.ts
import { prisma } from "./prisma";

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
        metadata: params.metadata ?? {},
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
  fromStatus: string | null;
  toStatus: string;
  changedBy: string;
  notes?: string;
}): Promise<void> {
  try {
    await prisma.statusTimeline.create({
      data: {
        suratMasukId: params.suratMasukId,
        fromStatus: params.fromStatus as never,
        toStatus: params.toStatus as never,
        changedById: params.changedBy,
        notes: params.notes,
      },
    });
  } catch (error) {
    console.error("[StatusTimeline Error]", error);
  }
}
