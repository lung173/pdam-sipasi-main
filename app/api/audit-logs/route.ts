// app/api/audit-logs/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, successResponse, errorResponse } from "@/lib/auth-helpers";

// GET /api/audit-logs — Admin only
export async function GET(req: NextRequest) {
  return requireRole(req, ["AGENDARIS"], async () => {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get("page") ?? "1");
      const limit = parseInt(searchParams.get("limit") ?? "30");
      const userId = searchParams.get("userId");
      const documentId = searchParams.get("documentId");
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = {};
      if (userId) where.userId = userId;
      if (documentId) where.suratMasukId = documentId;

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: {
            user: { select: { name: true, role: true } },
            suratMasuk: { select: { nomorSurat: true } },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.auditLog.count({ where }),
      ]);

      return successResponse({ data: logs, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (error) {
      return errorResponse("Gagal mengambil audit log.", 500);
    }
  });
}
