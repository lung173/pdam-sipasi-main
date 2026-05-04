// app/api/documents/[id]/disposisi/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, successResponse, errorResponse, getClientIp } from "@/lib/auth-helpers";
import { createAuditLog, createStatusTimeline } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

const JABATAN_VALID = [
  "Kabag Admin dan Keu",
  "Kabag Teknik",
  "Kabag Hublang",
  "Kepala SPI",
  "Kacab. Utara",
  "Kacab. Selatan",
];

// POST /api/documents/[id]/disposisi
// - AGENDARIS : update metadata dokumen + teruskan ke Direktur (tanpa buat LembarDisposisi)
// - DIREKTUR  : buat / update LembarDisposisi dengan jabatanKe + instruksi
export async function POST(req: NextRequest, props: Params) {
  const params = await props.params;
  return requireAuth(req, async (user, request) => {
    if (!["AGENDARIS", "DIREKTUR"].includes(user.role)) {
      return errorResponse("Tidak memiliki akses untuk tindakan disposisi.", 403);
    }

    try {
      const body = await request.json();

      // ── AGENDARIS: Teruskan dokumen ke Direktur (update metadata saja) ──
      if (user.role === "AGENDARIS") {
        const {
          nomorSurat, perihal, asalSurat, nomorAgenda, tanggalSurat, tanggalTerima,
        } = body as {
          nomorSurat?: string;
          perihal?: string;
          asalSurat?: string;
          nomorAgenda?: string;
          tanggalSurat?: string;
          tanggalTerima?: string;
        };

        const doc = await prisma.suratMasuk.findUnique({ where: { id: params.id } });
        if (!doc) return errorResponse("Dokumen tidak ditemukan.", 404);

        if (doc.currentStatus !== "MENUNGGU_REVIEW_AGENDARIS") {
          return errorResponse("Dokumen tidak dalam tahap review Agendaris.", 400);
        }

        const prevStatus = doc.currentStatus;

        await prisma.suratMasuk.update({
          where: { id: doc.id },
          data: {
            currentStatus: "MENUNGGU_KEPUTUSAN_DIREKTUR" as never,
            currentHolder: "DIREKTUR",
            ...(nomorSurat && { nomorSurat }),
            ...(perihal && { perihal }),
            ...(asalSurat && { asalSurat }),
            ...(nomorAgenda && { nomorAgenda }),
            ...(tanggalSurat && { tanggalSurat: new Date(tanggalSurat) }),
            ...(tanggalTerima && { tanggalTerima: new Date(tanggalTerima) }),
          },
        });

        await createStatusTimeline({
          documentId: doc.id,
          fromStatus: prevStatus,
          toStatus: "MENUNGGU_KEPUTUSAN_DIREKTUR",
          changedBy: user.id,
          notes: "Agendaris meneruskan dokumen beserta lembar disposisi ke Direktur.",
        });

        await createAuditLog({
          userId: user.id,
          documentId: doc.id,
          action: "DOKUMEN_DITERUSKAN_KE_DIREKTUR",
          description: `Agendaris meneruskan dokumen ${doc.nomorSurat} ke Direktur`,
          metadata: { nomorSurat, perihal, asalSurat, nomorAgenda },
          ipAddress: getClientIp(request),
        });

        return successResponse(
          { id: doc.id },
          "Dokumen berhasil diteruskan ke Direktur. Direktur akan mengisi lembar disposisi."
        );
      }

      // ── DIREKTUR: Buat / update LembarDisposisi ──
      const {
        jabatanKe, instruksi, keterangan, tanggalPenyelesaian,
      } = body as {
        jabatanKe: string;
        instruksi?: string;
        keterangan?: string;
        tanggalPenyelesaian?: string;
      };

      if (!jabatanKe) {
        return errorResponse(
          `Pilih penerima disposisi yang valid: ${JABATAN_VALID.join(", ")}.`,
          400
        );
      }
      
      const selectedJabatans = jabatanKe.split(",").map(j => j.trim());
      const allValid = selectedJabatans.every(j => JABATAN_VALID.includes(j));
      if (!allValid) {
        return errorResponse(
          `Pilih penerima disposisi yang valid: ${JABATAN_VALID.join(", ")}.`,
          400
        );
      }
      if (!instruksi?.trim()) {
        return errorResponse("Isi instruksi/informasi wajib diisi.", 400);
      }

      const doc = await prisma.suratMasuk.findUnique({ where: { id: params.id } });
      if (!doc) return errorResponse("Dokumen tidak ditemukan.", 404);

      const validStatuses = ["MENUNGGU_KEPUTUSAN_DIREKTUR", "DIPROSES_DIREKTUR"];
      if (!validStatuses.includes(doc.currentStatus)) {
        return errorResponse("Dokumen tidak dalam tahap keputusan Direktur.", 400);
      }

      const prevStatus = doc.currentStatus;

      // Cek apakah sudah ada LembarDisposisi untuk dokumen ini
      const existing = await prisma.lembarDisposisi.findFirst({
        where: { suratMasukId: doc.id },
        orderBy: { createdAt: "desc" },
      });

      let disposisi;
      if (existing) {
        disposisi = await prisma.lembarDisposisi.update({
          where: { id: existing.id },
          data: {
            jabatanKe,
            instruksi,
            keterangan,
            tanggalTandaTangan: tanggalPenyelesaian ? new Date(tanggalPenyelesaian) : null,
            dariId: user.id,
          } as any,
        });
      } else {
        disposisi = await prisma.lembarDisposisi.create({
          data: {
            suratMasukId: doc.id,
            dariId: user.id,
            jabatanKe,
            instruksi,
            keterangan,
            tanggalTandaTangan: tanggalPenyelesaian ? new Date(tanggalPenyelesaian) : null,
          } as any,
        });
      }

      await createStatusTimeline({
        documentId: doc.id,
        fromStatus: prevStatus,
        toStatus: prevStatus as never, // Status tidak berubah, hanya disposisi tersimpan
        changedBy: user.id,
        notes: `Direktur mengisi lembar disposisi. Kepada: ${jabatanKe}. Instruksi: ${instruksi}`,
      });

      await createAuditLog({
        userId: user.id,
        documentId: doc.id,
        action: "DISPOSISI_DIISI_DIREKTUR",
        description: `Direktur mengisi lembar disposisi untuk ${doc.nomorSurat}. Kepada: ${jabatanKe}`,
        metadata: { jabatanKe, instruksi },
        ipAddress: getClientIp(request),
      });

      return successResponse(disposisi, "Lembar disposisi berhasil disimpan.");
    } catch (error) {
      console.error("[POST /api/documents/[id]/disposisi]", error);
      return errorResponse("Gagal memproses disposisi.", 500);
    }
  });
}
