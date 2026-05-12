// app/api/users/[id]/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { requireRole, successResponse, errorResponse, getClientIp } from "@/lib/auth-helpers";
import { createAuditLog } from "@/lib/audit";
import { updateUserSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

// GET /api/users/[id]
export async function GET(req: NextRequest, props: Params) {
  const params = await props.params;
  return requireRole(req, ["AGENDARIS"], async () => {
    try {
      const u = await prisma.user.findUnique({
        where: { id: params.id },
        select: {
          id: true, name: true, email: true, role: true,
          divisi: true, isActive: true, createdAt: true, updatedAt: true,
          _count: { select: { suratMasukCreated: true, auditLogs: true } },
        },
      });
      if (!u) return errorResponse("Pengguna tidak ditemukan.", 404);
      return successResponse(u);
    } catch (error) {
      return errorResponse("Gagal mengambil data pengguna.", 500);
    }
  });
}

// PATCH /api/users/[id]
export async function PATCH(req: NextRequest, props: Params) {
  const params = await props.params;
  return requireRole(req, ["AGENDARIS"], async (adminUser, request) => {
    try {
      const body = await request.json();
      const parsed = updateUserSchema.safeParse(body);

      if (!parsed.success) {
        return errorResponse("Validasi gagal: " + JSON.stringify(parsed.error.flatten()), 422);
      }

      const { password, ...rest } = parsed.data;

      const updateData: Record<string, unknown> = { ...rest };
      if (password) updateData.passwordHash = bcrypt.hashSync(password, 12);

      // Cek email unik jika diubah
      if (rest.email) {
        const existing = await prisma.user.findFirst({
          where: { email: rest.email, NOT: { id: params.id } },
        });
        if (existing) return errorResponse(`Email "${rest.email}" sudah digunakan.`, 409);
      }

      const updated = await prisma.user.update({
        where: { id: params.id },
        data: updateData,
        select: {
          id: true, name: true, email: true, role: true,
          divisi: true, isActive: true, updatedAt: true,
        },
      });

      await createAuditLog({
        userId: adminUser.id,
        action: "USER_UPDATED",
        description: `Admin memperbarui user: ${updated.email}`,
        ipAddress: getClientIp(request),
      });

      return successResponse(updated, "Pengguna berhasil diperbarui.");
    } catch (error) {
      console.error("[PATCH /api/users/[id]]", error);
      return errorResponse("Gagal memperbarui pengguna.", 500);
    }
  });
}

// DELETE /api/users/[id] — soft delete (nonaktifkan)
export async function DELETE(req: NextRequest, props: Params) {
  const params = await props.params;
  return requireRole(req, ["AGENDARIS"], async (adminUser, request) => {
    try {
      if (adminUser.id === params.id) {
        return errorResponse("Anda tidak dapat menonaktifkan akun sendiri.", 400);
      }

      const u = await prisma.user.findUnique({ where: { id: params.id } });
      if (!u) return errorResponse("Pengguna tidak ditemukan.", 404);

      await prisma.user.update({
        where: { id: params.id },
        data: { isActive: false },
      });

      await createAuditLog({
        userId: adminUser.id,
        action: "USER_DEACTIVATED",
        description: `Admin menonaktifkan user: ${u.email}`,
        ipAddress: getClientIp(request),
      });

      return successResponse(null, `Pengguna ${u.name} berhasil dinonaktifkan.`);
    } catch (error) {
      return errorResponse("Gagal menonaktifkan pengguna.", 500);
    }
  });
}
