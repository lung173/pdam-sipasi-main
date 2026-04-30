// lib/audit.ts
import { prisma } from "./prisma";

interface AuditParams {
  userId: string;
  documentId?: string;
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
        suratMasukId: params.documentId,
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
  documentId: string;
  fromStatus: string | null;
  toStatus: string;
  changedBy: string;
  notes?: string;
}): Promise<void> {
  try {
    await prisma.statusTimeline.create({
      data: {
        suratMasukId: params.documentId,
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
