// app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { requireRole, successResponse, errorResponse, getClientIp } from "@/lib/auth-helpers";
import { createAuditLog } from "@/lib/audit";
import { createUserSchema } from "@/lib/validations";

// GET /api/users — Admin only
export async function GET(req: NextRequest) {
  return requireRole(req, ["AGENDARIS"], async (user) => {
    try {
      const { searchParams } = new URL(req.url);
      const role = searchParams.get("role");
      const search = searchParams.get("search") ?? "";

      const users = await prisma.user.findMany({
        where: {
          ...(role ? { role: role as UserRole } : {}),
          ...(search
            ? {
                OR: [
                  { name: { contains: search, mode: "insensitive" } },
                  { email: { contains: search, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          divisi: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return successResponse(users);
    } catch (error) {
      console.error("[GET /api/users]", error);
      return errorResponse("Gagal mengambil data pengguna.", 500);
    }
  });
}

// POST /api/users — Admin only, buat user baru
export async function POST(req: NextRequest) {
  return requireRole(req, ["AGENDARIS"], async (user, request) => {
    try {
      const body = await request.json();
      const parsed = createUserSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: "Validasi gagal", errors: parsed.error.flatten().fieldErrors },
          { status: 422 }
        );
      }

      const { name, email, password, role: newRole, divisi } = parsed.data;

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return errorResponse(`Email "${email}" sudah terdaftar.`, 409);

      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash: bcrypt.hashSync(password, 12),
          role: newRole as UserRole,
          divisi,
        },
        select: {
          id: true, name: true, email: true, role: true, divisi: true, isActive: true, createdAt: true,
        },
      });

      await createAuditLog({
        userId: user.id,
        action: "USER_CREATED",
        description: `Admin membuat user baru: ${email} (${newRole})`,
        ipAddress: getClientIp(request),
      });

      return successResponse(newUser, "Pengguna berhasil dibuat.", 201);
    } catch (error) {
      console.error("[POST /api/users]", error);
      return errorResponse("Gagal membuat pengguna.", 500);
    }
  });
}
