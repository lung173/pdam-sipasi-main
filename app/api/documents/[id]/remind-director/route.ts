import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, successResponse, errorResponse, getClientIp } from "@/lib/auth-helpers";
import { createAuditLog, createStatusTimeline } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

// POST /api/documents/[id]/remind-director
// Admin mengirimkan peringatan ke meja direktur
export async function POST(req: NextRequest, props: Params) {
  const params = await props.params;
  return requireAuth(req, async (user, request) => {
    if (user.role !== "AGENDARIS") {
      return errorResponse("Hanya Admin yang dapat mengirim reminder.", 403);
    }

    try {
      const doc = await prisma.suratMasuk.findUnique({
        where: { id: params.id },
      });

      if (!doc) return errorResponse("Dokumen tidak ditemukan.", 404);

      if (!["MENUNGGU_KEPUTUSAN_DIREKTUR", "DIPROSES_DIREKTUR"].includes(doc.currentStatus)) {
        return errorResponse("Dokumen saat ini tidak berada di meja Direktur.", 400);
      }

      // Add a status timeline entry marked as URGENT Reminder
      await createStatusTimeline({
        suratMasukId: doc.id,
        fromStatus: doc.currentStatus,
        toStatus: doc.currentStatus, // Tidak mengubah status
        changedBy: user.id,
        notes: "[URGENT] Peringatan: Mohon Direktur Utama segera menindaklanjuti dokumen ini yang telah memasuki batas waktu peninjauan.",
      });

      await createAuditLog({
        userId: user.id,
        suratMasukId: doc.id,
        action: "REMIND_DIRECTOR",
        description: `Admin mengirim reminder ke direktur untuk dokumen ${doc.nomorSurat}`,
        ipAddress: getClientIp(request),
      });

      return successResponse(null, "Pengingat berhasil disuntikkan ke meja Direktur.");
    } catch (error) {
      console.error("[POST /api/documents/[id]/remind-director]", error);
      return errorResponse("Gagal mengirim pengingat.", 500);
    }
  });
}
