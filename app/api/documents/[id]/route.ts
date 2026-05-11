// app/api/documents/[id]/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, successResponse, errorResponse, getClientIp } from "@/lib/auth-helpers";
import { createAuditLog, createStatusTimeline } from "@/lib/audit";
import { updateDocumentSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

// ─── GET /api/documents/[id] ──────────────────────────────────
export async function GET(req: NextRequest, props: Params) {
  const params = await props.params;
  return requireAuth(req, async (user) => {
    try {
      const doc = await prisma.suratMasuk.findUnique({
        where: { id: params.id },
        include: {
          createdBy: { select: { id: true, name: true, divisi: true, role: true } },
          files: {
            include: { uploadedBy: { select: { name: true } } },
            orderBy: { uploadedAt: "desc" },
          },
          reviews: {
            include: { reviewedBy: { select: { name: true } } },
            orderBy: { reviewedAt: "desc" },
          },
          decisions: {
            include: { director: { select: { name: true } } },
            orderBy: { decidedAt: "desc" },
          },
          statusTimeline: { orderBy: { createdAt: "asc" } },
          archive: {
            include: { archivedBy: { select: { name: true } } },
          },
        },
      });

      if (!doc) return errorResponse("Dokumen tidak ditemukan.", 404);

      // Staff hanya bisa lihat miliknya
      if (user.role === "ADMIN_STAFF" && doc.createdById !== user.id) {
        return errorResponse("Akses ditolak.", 403);
      }

      return successResponse(doc);
    } catch (error) {
      console.error("[GET /api/documents/[id]]", error);
      return errorResponse("Gagal mengambil detail dokumen.", 500);
    }
  });
}

// ─── PATCH /api/documents/[id] ────────────────────────────────
// Staff update draft (hanya saat status DRAFT atau PERLU_REVISI)
export async function PATCH(req: NextRequest, props: Params) {
  const params = await props.params;
  return requireAuth(req, async (user, request) => {
    try {
      const doc = await prisma.suratMasuk.findUnique({ where: { id: params.id } });
      if (!doc) return errorResponse("Dokumen tidak ditemukan.", 404);

      // Hanya creator atau admin yang boleh edit
      if (user.role !== "AGENDARIS" && doc.createdById !== user.id) {
        return errorResponse("Anda tidak memiliki akses untuk mengedit dokumen ini.", 403);
      }

      // Hanya boleh edit saat status DRAFT atau PERLU_REVISI
      if (!["DRAFT", "PERLU_REVISI"].includes(doc.currentStatus) && user.role !== "AGENDARIS") {
        return errorResponse("Dokumen tidak dapat diedit pada status ini.", 400);
      }

      const body = await request.json();
      const parsed = updateDocumentSchema.safeParse(body);

      if (!parsed.success) {
        return errorResponse("Validasi gagal.", 422);
      }

      const updated = await prisma.suratMasuk.update({
        where: { id: params.id },
        data: {
          ...parsed.data,
          tanggalSurat: parsed.data.tanggalSurat
            ? new Date(parsed.data.tanggalSurat)
            : undefined,
        },
      });

      await createAuditLog({
        userId: user.id,
        suratMasukId: doc.id,
        action: "DOCUMENT_UPDATED",
        description: `Dokumen diperbarui: ${doc.nomorSurat}`,
        ipAddress: getClientIp(request),
      });

      return successResponse(updated, "Dokumen berhasil diperbarui.");
    } catch (error) {
      console.error("[PATCH /api/documents/[id]]", error);
      return errorResponse("Gagal memperbarui dokumen.", 500);
    }
  });
}

// ─── DELETE /api/documents/[id] ───────────────────────────────
// Hanya Admin yang bisa hapus (soft delete via status tidak ada, kita hard delete hanya saat DRAFT)
export async function DELETE(req: NextRequest, props: Params) {
  const params = await props.params;
  return requireAuth(req, async (user, request) => {
    if (user.role !== "AGENDARIS") {
      return errorResponse("Hanya Admin yang dapat menghapus dokumen.", 403);
    }

    try {
      const doc = await prisma.suratMasuk.findUnique({ where: { id: params.id } });
      if (!doc) return errorResponse("Dokumen tidak ditemukan.", 404);

      if (doc.currentStatus !== "DRAFT") {
        return errorResponse("Hanya dokumen berstatus DRAFT yang dapat dihapus.", 400);
      }

      await prisma.suratMasuk.delete({ where: { id: params.id } });

      await createAuditLog({
        userId: user.id,
        suratMasukId: undefined,
        action: "DOCUMENT_DELETED",
        description: `Dokumen dihapus: ${doc.nomorSurat}`,
        ipAddress: getClientIp(request),
      });

      return successResponse(null, "Dokumen berhasil dihapus.");
    } catch (error) {
      console.error("[DELETE /api/documents/[id]]", error);
      return errorResponse("Gagal menghapus dokumen.", 500);
    }
  });
}
