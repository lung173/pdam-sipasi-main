// app/api/documents/[id]/disposisi/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, successResponse, errorResponse, getClientIp } from "@/lib/auth-helpers";
import { createAuditLog, createStatusTimeline } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

// POST /api/documents/[id]/disposisi
// Agendaris / Direktur membuat lembar disposisi
export async function POST(req: NextRequest, props: Params) {
  const params = await props.params;
  return requireAuth(req, async (user, request) => {
    if (!["AGENDARIS", "DIREKTUR"].includes(user.role)) {
      return errorResponse("Tidak memiliki akses untuk membuat disposisi.", 403);
    }

    try {
      const body = await request.json();
      const { keId, instruksi, keterangan, tanggalPenyelesaian, nomorSurat, perihal, asalSurat, nomorAgenda, tanggalTerima } = body as {
        keId: string;
        instruksi?: string;
        keterangan?: string;
        tanggalPenyelesaian?: string;
        nomorSurat?: string;
        perihal?: string;
        asalSurat?: string;
        nomorAgenda?: string;
        tanggalTerima?: string;
      };

      if (!keId) return errorResponse("Pilih penerima disposisi.", 400);

      const [doc, ke] = await Promise.all([
        prisma.suratMasuk.findUnique({ where: { id: params.id } }),
        prisma.user.findUnique({ where: { id: keId }, select: { id: true, name: true } }),
      ]);

      if (!doc) return errorResponse("Dokumen tidak ditemukan.", 404);
      if (!ke)  return errorResponse("Penerima disposisi tidak ditemukan.", 404);

      const prevStatus = doc.currentStatus;

      const [disposisi] = await prisma.$transaction([
        prisma.lembarDisposisi.create({
          data: {
            suratMasukId: doc.id,
            dariId: user.id,
            keId,
            instruksi,
            keterangan,
            tanggalTandaTangan: tanggalPenyelesaian ? new Date(tanggalPenyelesaian) : null,
          },
        }),
        prisma.suratMasuk.update({
          where: { id: doc.id },
          data: {
            currentStatus: "MENUNGGU_KEPUTUSAN_DIREKTUR" as never,
            // Update document fields if Agendaris corrected them
            ...(nomorSurat   && { nomorSurat }),
            ...(perihal      && { perihal }),
            ...(asalSurat    && { asalSurat }),
            ...(nomorAgenda  && { nomorAgenda }),
            ...(tanggalTerima && { tanggalTerima: new Date(tanggalTerima) }),
          },
        }),
      ]);

      await createStatusTimeline({
        documentId: doc.id,
        fromStatus: prevStatus,
        toStatus: "MENUNGGU_KEPUTUSAN_DIREKTUR",
        changedBy: user.id,
        notes: `Lembar disposisi dibuat. Kepada: ${ke.name}. Instruksi: ${instruksi ?? "-"}`,
      });

      await createAuditLog({
        userId: user.id,
        documentId: doc.id,
        action: "DISPOSISI_DIBUAT",
        description: `Lembar disposisi ke ${ke.name} dibuat untuk ${doc.nomorSurat}`,
        metadata: { keId, instruksi },
        ipAddress: getClientIp(request),
      });

      return successResponse(disposisi, `Lembar disposisi berhasil dibuat dan diteruskan ke Direktur.`);
    } catch (error) {
      console.error("[POST /api/documents/[id]/disposisi]", error);
      return errorResponse("Gagal membuat lembar disposisi.", 500);
    }
  });
}
