// app/api/user/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, successResponse, errorResponse } from "@/lib/auth-helpers";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100),
  title: z.string().max(50).optional().nullable(),
  image: z.string().optional().nullable(),
  signature: z.string().optional().nullable(),
});

/**
 * @file app/api/user/profile/route.ts
 * @description API untuk mengupdate profil user sendiri (nama, gelar, foto profil).
 */

export async function PUT(req: NextRequest) {
  return requireAuth(req, async (user, request) => {
    try {
      const body = await request.json();
      const parsed = updateProfileSchema.safeParse(body);

      if (!parsed.success) {
        return errorResponse("Validasi gagal", 422);
      }

      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: parsed.data.name,
          title: parsed.data.title,
          image: parsed.data.image,
          signature: parsed.data.signature,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          divisi: true,
          title: true,
          image: true,
          signature: true,
        }
      });

      return successResponse(updated, "Profil berhasil diperbarui.");
    } catch (error) {
      console.error("[PUT /api/user/profile]", error);
      return errorResponse("Gagal memperbarui profil.");
    }
  });
}
