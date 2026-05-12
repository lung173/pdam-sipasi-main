// app/api/documents/[id]/review/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, successResponse, errorResponse, getClientIp } from "@/lib/auth-helpers";
import { createAuditLog, createStatusTimeline } from "@/lib/audit";
import { reviewDocumentSchema } from "@/lib/validations";
import { DocumentStatus } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

// POST /api/documents/[id]/review
// Admin: teruskan ke Direktur atau kembalikan ke Staff
export async function POST(req: NextRequest, props: Params) {
  const params = await props.params;
  return requireAuth(req, async (user, request) => {
    if (user.role !== "AGENDARIS") {
      return errorResponse("Hanya Admin yang dapat melakukan review dokumen.", 403);
    }

    try {
      const body = await request.json();
      const parsed = reviewDocumentSchema.safeParse(body);

      if (!parsed.success) {
        return errorResponse("Validasi gagal: " + JSON.stringify(parsed.error.flatten()), 422);
      }

      const { reviewStatus, reviewNote } = parsed.data;

      const doc = await prisma.suratMasuk.findUnique({ where: { id: params.id } });
      if (!doc) return errorResponse("Dokumen tidak ditemukan.", 404);

      if (doc.currentStatus !== "MENUNGGU_REVIEW_AGENDARIS") {
        return errorResponse(
          `Dokumen tidak dalam status review. Status saat ini: ${doc.currentStatus}`,
          400
        );
      }

      const prevStatus = doc.currentStatus;
      let newStatus: string;
      let newHolder: string;
      let timelineNote: string;

      if (reviewStatus === "DITERUSKAN") {
        newStatus = "MENUNGGU_KEPUTUSAN_DIREKTUR";
        newHolder = "DIREKTUR";
        timelineNote = "Dokumen diteruskan ke Direktur Utama oleh Admin";
      } else {
        newStatus = "PERLU_REVISI";
        newHolder = doc.createdById;
        timelineNote = `Dokumen dikembalikan ke Staff untuk revisi. Catatan: ${reviewNote ?? "-"}`;
      }

      // Simpan review & update dokumen dalam transaksi
      const [review, updatedDoc] = await prisma.$transaction([
        prisma.documentReview.create({
          data: {
            suratMasukId: doc.id,
            reviewedById: user.id,
            reviewStatus,
            reviewNote,
          },
        }),
        prisma.suratMasuk.update({
          where: { id: doc.id },
          data: {
            currentStatus: newStatus as DocumentStatus,
            currentHolder: newHolder,
          },
        }),
      ]);

      await createStatusTimeline({
        suratMasukId: doc.id,
        fromStatus: prevStatus,
        toStatus: newStatus,
        changedBy: user.id,
        notes: timelineNote,
      });

      await createAuditLog({
        userId: user.id,
        suratMasukId: doc.id,
        action: `REVIEW_${reviewStatus}`,
        description: `Admin ${reviewStatus === "DITERUSKAN" ? "meneruskan" : "mengembalikan"} dokumen ${doc.nomorSurat}`,
        metadata: { reviewStatus, reviewNote },
        ipAddress: getClientIp(request),
      });

      return successResponse(
        { review, document: updatedDoc },
        reviewStatus === "DITERUSKAN"
          ? "Dokumen berhasil diteruskan ke Direktur Utama."
          : "Dokumen dikembalikan ke Staff untuk perbaikan."
      );
    } catch (error) {
      console.error("[POST /api/documents/[id]/review]", error);
      return errorResponse("Gagal memproses review dokumen.", 500);
    }
  });
}
