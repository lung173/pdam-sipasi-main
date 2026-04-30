// app/api/stats/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, successResponse, errorResponse } from "@/lib/auth-helpers";

// GET /api/stats — statistik dashboard berdasarkan role
export async function GET(req: NextRequest) {
  return requireAuth(req, async (user) => {
    try {
      if (user.role === "ADMIN_STAFF") {
        const [total, draft, menungguReview, perluRevisi, selesai] = await Promise.all([
          prisma.suratMasuk.count({ where: { createdById: user.id } }),
          prisma.suratMasuk.count({ where: { createdById: user.id, currentStatus: "DRAFT" } }),
          prisma.suratMasuk.count({ where: { createdById: user.id, currentStatus: "MENUNGGU_REVIEW_AGENDARIS" } }),
          prisma.suratMasuk.count({ where: { createdById: user.id, currentStatus: "PERLU_REVISI" } }),
          prisma.suratMasuk.count({ where: { createdById: user.id, currentStatus: "ARSIP_FINAL_TERSIMPAN" } }),
        ]);
        return successResponse({ total, draft, menungguReview, perluRevisi, selesai });
      }

      if (user.role === "AGENDARIS") {
        const [masuk, diteruskan, menungguPengambilan] = await Promise.all([
          prisma.suratMasuk.count({ where: { currentStatus: "MENUNGGU_REVIEW_AGENDARIS" } }),
          prisma.suratMasuk.count({ where: { currentStatus: "MENUNGGU_KEPUTUSAN_DIREKTUR" } }),
          prisma.suratMasuk.count({ where: { currentStatus: "MENUNGGU_PENGAMBILAN_STAFF" } }),
        ]);
        return successResponse({ masuk, diteruskan, menungguPengambilan });
      }

      if (user.role === "DIREKTUR") {
        const [menunggu, diproses, selesaiCount] = await Promise.all([
          prisma.suratMasuk.count({ where: { currentStatus: "MENUNGGU_KEPUTUSAN_DIREKTUR" } }),
          prisma.suratMasuk.count({ where: { currentStatus: "DIPROSES_DIREKTUR" } }),
          prisma.directorDecision.count({ where: { directorId: user.id } }),
        ]);
        return successResponse({ menunggu, diproses, totalKeputusan: selesaiCount });
      }

      // ADMIN — full stats
      const [
        totalDokumen, totalUser, menungguArsip, arsipFinal,
        dokumenPerStatus, recentAudit,
      ] = await Promise.all([
        prisma.suratMasuk.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.suratMasuk.count({ where: { currentStatus: "MENUNGGU_ARSIP_ADMIN" } }),
        prisma.suratMasuk.count({ where: { currentStatus: "ARSIP_FINAL_TERSIMPAN" } }),
        prisma.suratMasuk.groupBy({
          by: ["currentStatus"],
          _count: { currentStatus: true },
          orderBy: { _count: { currentStatus: "desc" } },
        }),
        prisma.auditLog.findMany({
          take: 10,
          orderBy: { createdAt: "desc" },
          include: { user: { select: { name: true, role: true } } },
        }),
      ]);

      return successResponse({
        totalDokumen, totalUser, menungguArsip, arsipFinal,
        dokumenPerStatus: dokumenPerStatus.map((s) => ({
          status: s.currentStatus,
          count: s._count.currentStatus,
        })),
        recentAudit,
      });
    } catch (error) {
      console.error("[GET /api/stats]", error);
      return errorResponse("Gagal mengambil statistik.", 500);
    }
  });
}
