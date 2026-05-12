// app/api/documents/[id]/archive/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, successResponse, errorResponse, getClientIp } from "@/lib/auth-helpers";
import { createAuditLog, createStatusTimeline } from "@/lib/audit";
import { archiveDocumentSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

// POST /api/documents/[id]/archive
// Admin mengarsipkan dokumen final
export async function POST(req: NextRequest, props: Params) {
  const params = await props.params;
  return requireAuth(req, async (user, request) => {
    if (user.role !== "AGENDARIS") {
      return errorResponse("Hanya Admin yang dapat melakukan pengarsipan.", 403);
    }

    try {
      const body = await request.json();
      const parsed = archiveDocumentSchema.safeParse(body);
      if (!parsed.success) return errorResponse("Validasi gagal.", 422);

      const doc = await prisma.suratMasuk.findUnique({
        where: { id: params.id },
        include: { archive: true, files: true },
      });

      if (!doc) return errorResponse("Dokumen tidak ditemukan.", 404);
      if (doc.archive) return errorResponse("Dokumen ini sudah diarsipkan.", 409);

      if (doc.currentStatus !== "MENUNGGU_ARSIP_ADMIN") {
        return errorResponse(
          `Dokumen belum siap diarsipkan. Status saat ini: ${doc.currentStatus}`,
          400
        );
      }

      // Pastikan ada file FINAL_SCAN
      const hasFinalScan = doc.files.some((f) => f.fileType === "FINAL_SCAN");
      if (!hasFinalScan) {
        return errorResponse("Belum ada file scan final yang diupload untuk dokumen ini.", 400);
      }

      const prevStatus = doc.currentStatus;
      const serverLocation =
        parsed.data.serverLocation ?? `/arsip/${new Date().getFullYear()}/${doc.nomorSurat}`;

      const now = new Date();
      const [archive, updatedDoc] = await prisma.$transaction([
        prisma.archive.create({
          data: {
            suratMasukId: doc.id,
            archivedById: user.id,
            serverLocation,
            notes: parsed.data.notes,
            bulan: now.getMonth() + 1,
            tahun: now.getFullYear(),
          },
        }),
        prisma.suratMasuk.update({
          where: { id: doc.id },
          data: {
            currentStatus: "ARSIP_FINAL_TERSIMPAN",
            currentHolder: "AGENDARIS",
          },
        }),
      ]);

      await createStatusTimeline({
        suratMasukId: doc.id,
        fromStatus: prevStatus,
        toStatus: "ARSIP_FINAL_TERSIMPAN",
        changedBy: user.id,
        notes: `Dokumen diarsipkan oleh Admin. Lokasi: ${serverLocation}`,
      });

      await createAuditLog({
        userId: user.id,
        suratMasukId: doc.id,
        action: "DOCUMENT_ARCHIVED",
        description: `Dokumen ${doc.nomorSurat} diarsipkan ke ${serverLocation}`,
        metadata: { serverLocation, notes: parsed.data.notes },
        ipAddress: getClientIp(request),
      });

      return successResponse(
        { archive, document: updatedDoc },
        "Dokumen berhasil diarsipkan. Proses selesai."
      );
    } catch (error) {
      console.error("[POST /api/documents/[id]/archive]", error);
      return errorResponse("Gagal mengarsipkan dokumen.", 500);
    }
  });
}
