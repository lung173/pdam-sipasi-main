// app/api/documents/[id]/notify-pickup/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, successResponse, errorResponse, getClientIp } from "@/lib/auth-helpers";
import { createAuditLog, createStatusTimeline } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

// POST /api/documents/[id]/notify-pickup
// Admin memberitahu Staff untuk mengambil surat fisik
export async function POST(req: NextRequest, props: Params) {
  const params = await props.params;
  return requireAuth(req, async (user, request) => {
    if (user.role !== "AGENDARIS") {
      return errorResponse("Hanya Admin yang dapat mengirim notifikasi pengambilan.", 403);
    }

    try {
      const doc = await prisma.suratMasuk.findUnique({
        where: { id: params.id },
        include: { createdBy: true },
      });

      if (!doc) return errorResponse("Dokumen tidak ditemukan.", 404);

      if (doc.currentStatus !== "KEPUTUSAN_DIREKTUR_SELESAI") {
        return errorResponse(
          `Notifikasi hanya bisa dikirim saat status "Keputusan Direktur Selesai". Status: ${doc.currentStatus}`,
          400
        );
      }

      const prevStatus = doc.currentStatus;

      const [handoverLog, updatedDoc] = await prisma.$transaction([
        prisma.handoverLog.create({
          data: {
            documentId: doc.id,
            staffId: doc.createdById,
            agendarisId: user.id, // we keep the DB column name as is since we didn't migrate it
            confirmationStatus: "MENUNGGU",
          },
        }),
        prisma.suratMasuk.update({
          where: { id: doc.id },
          data: {
            currentStatus: "MENUNGGU_PENGAMBILAN_STAFF",
            currentHolder: doc.createdById,
          },
        }),
      ]);

      await createStatusTimeline({
        documentId: doc.id,
        fromStatus: prevStatus,
        toStatus: "MENUNGGU_PENGAMBILAN_STAFF",
        changedBy: user.id,
        notes: `Admin menghubungi Staff ${doc.createdBy.name} untuk pengambilan surat fisik`,
      });

      await createAuditLog({
        userId: user.id,
        documentId: doc.id,
        action: "NOTIFY_PICKUP",
        description: `Admin mengirim notifikasi pengambilan ke Staff: ${doc.createdBy.name}`,
        ipAddress: getClientIp(request),
      });

      return successResponse(
        { handoverLog, document: updatedDoc },
        `Notifikasi pengambilan berhasil dikirim ke ${doc.createdBy.name}.`
      );
    } catch (error) {
      console.error("[POST /api/documents/[id]/notify-pickup]", error);
      return errorResponse("Gagal mengirim notifikasi.", 500);
    }
  });
}

// POST /api/documents/[id]/confirm-pickup
// Staff konfirmasi sudah mengambil surat & siap scan
export async function PUT(req: NextRequest, props: Params) {
  const params = await props.params;
  return requireAuth(req, async (user, request) => {
    if (user.role !== "ADMIN_STAFF") {
      return errorResponse("Hanya Staff yang dapat mengkonfirmasi pengambilan.", 403);
    }

    try {
      const doc = await prisma.suratMasuk.findUnique({ where: { id: params.id } });
      if (!doc) return errorResponse("Dokumen tidak ditemukan.", 404);
      if (doc.createdById !== user.id) return errorResponse("Akses ditolak.", 403);

      if (doc.currentStatus !== "MENUNGGU_PENGAMBILAN_STAFF") {
        return errorResponse("Dokumen tidak dalam status menunggu pengambilan.", 400);
      }

      const handoverLog = await prisma.handoverLog.findFirst({
        where: { documentId: doc.id, staffId: user.id, confirmationStatus: "MENUNGGU" },
        orderBy: { handoverTime: "desc" },
      });

      const prevStatus = doc.currentStatus;

      await prisma.$transaction([
        ...(handoverLog
          ? [
              prisma.handoverLog.update({
                where: { id: handoverLog.id },
                data: { confirmationStatus: "DIKONFIRMASI", confirmedAt: new Date() },
              }),
            ]
          : []),
        prisma.suratMasuk.update({
          where: { id: doc.id },
          data: { currentStatus: "MENUNGGU_SCAN_FINAL" },
        }),
      ]);

      await createStatusTimeline({
        documentId: doc.id,
        fromStatus: prevStatus,
        toStatus: "MENUNGGU_SCAN_FINAL",
        changedBy: user.id,
        notes: "Staff mengkonfirmasi pengambilan surat fisik. Siap scan final.",
      });

      await createAuditLog({
        userId: user.id,
        documentId: doc.id,
        action: "PICKUP_CONFIRMED",
        description: `Staff mengkonfirmasi pengambilan surat ${doc.nomorSurat}`,
        ipAddress: getClientIp(request),
      });

      return successResponse(null, "Pengambilan dikonfirmasi. Silakan upload scan final dokumen.");
    } catch (error) {
      console.error("[PUT /api/documents/[id]/notify-pickup]", error);
      return errorResponse("Gagal mengkonfirmasi pengambilan.", 500);
    }
  });
}
