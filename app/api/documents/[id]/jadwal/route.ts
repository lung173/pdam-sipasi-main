// app/api/documents/[id]/jadwal/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, successResponse, errorResponse, getClientIp } from "@/lib/auth-helpers";
import { createAuditLog, createStatusTimeline } from "@/lib/audit";
import { DocumentStatus } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

type WaktuKirim = "LANGSUNG" | "BESOK_PAGI" | "BESOK_SIANG" | "LUSA_PAGI" | "LUSA_SIANG";

function hitungJadwal(waktu: WaktuKirim): Date {
  const now = new Date();
  const d = new Date(now);
  switch (waktu) {
    case "LANGSUNG":   return now;
    case "BESOK_PAGI": d.setDate(d.getDate() + 1); d.setHours(7, 0, 0, 0);  return d;
    case "BESOK_SIANG":d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0);  return d;
    case "LUSA_PAGI":  d.setDate(d.getDate() + 2); d.setHours(7, 0, 0, 0);  return d;
    case "LUSA_SIANG": d.setDate(d.getDate() + 2); d.setHours(9, 0, 0, 0);  return d;
    default:           return now;
  }
}

// POST /api/documents/[id]/jadwal
// Agendaris menjadwalkan pengiriman ke Direktur
export async function POST(req: NextRequest, props: Params) {
  const params = await props.params;
  return requireAuth(req, async (user, request) => {
    if (user.role !== "AGENDARIS") {
      return errorResponse("Hanya Agendaris yang dapat membuat jadwal pengiriman.", 403);
    }

    try {
      const body = await request.json();
      const { waktu, isUrgen, catatan } = body as {
        waktu: WaktuKirim;
        isUrgen?: boolean;
        catatan?: string;
      };

      const VALID = ["LANGSUNG","BESOK_PAGI","BESOK_SIANG","LUSA_PAGI","LUSA_SIANG"];
      if (!waktu || !VALID.includes(waktu)) {
        return errorResponse("Pilihan waktu tidak valid.", 400);
      }

      const doc = await prisma.suratMasuk.findUnique({ where: { id: params.id } });
      if (!doc) return errorResponse("Dokumen tidak ditemukan.", 404);

      if (doc.currentStatus !== "MENUNGGU_REVIEW_AGENDARIS") {
        return errorResponse(`Dokumen tidak dalam status review. Status: ${doc.currentStatus}`, 400);
      }

      const jadwalKirim = hitungJadwal(waktu);
      const langsung = waktu === "LANGSUNG";
      const newStatus = langsung ? "MENUNGGU_KEPUTUSAN_DIREKTUR" : "DIJADWALKAN_KE_DIREKTUR";
      const prevStatus = doc.currentStatus;

      const [jadwal] = await prisma.$transaction([
        prisma.jadwalDirekturs.create({
          data: {
            suratMasukId: doc.id,
            createdById: user.id,
            jadwalKirim,
            isUrgen: isUrgen ?? false,
            isSent: langsung,
            sentAt: langsung ? new Date() : null,
            catatan,
          },
        }),
        prisma.suratMasuk.update({
          where: { id: doc.id },
          data: { currentStatus: newStatus as DocumentStatus },
        }),
      ]);

      await createStatusTimeline({
        suratMasukId: doc.id,
        fromStatus: prevStatus,
        toStatus: newStatus,
        changedBy: user.id,
        notes: langsung
          ? "Dokumen langsung diteruskan ke Direktur Utama."
          : `Dokumen dijadwalkan ke Direktur pada ${jadwalKirim.toLocaleString("id-ID")}.${isUrgen ? " [URGEN]" : ""}`,
      });

      await createAuditLog({
        userId: user.id,
        suratMasukId: doc.id,
        action: langsung ? "JADWAL_LANGSUNG" : "JADWAL_KIRIM_DIREKTUR",
        description: `Jadwal pengiriman ke Direktur: ${waktu}`,
        metadata: { waktu, isUrgen, jadwalKirim },
        ipAddress: getClientIp(request),
      });

      return successResponse(jadwal, langsung
        ? "Dokumen langsung diteruskan ke Direktur Utama."
        : `Dokumen dijadwalkan dikirim ke Direktur pada ${jadwalKirim.toLocaleString("id-ID")}.`
      );
    } catch (error) {
      console.error("[POST /api/documents/[id]/jadwal]", error);
      return errorResponse("Gagal membuat jadwal.", 500);
    }
  });
}
