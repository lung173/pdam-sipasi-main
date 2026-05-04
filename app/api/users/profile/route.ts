import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, successResponse, errorResponse } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  return requireAuth(req, async (user) => {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { signature: true }
    });
    return successResponse({ signature: dbUser?.signature }, "Data profil");
  });
}

export async function POST(req: NextRequest) {
  return requireAuth(req, async (user, request) => {
    try {
      const { signature } = await request.json();
      
      if (!signature) {
        return errorResponse("Tanda tangan tidak boleh kosong", 400);
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { signature }
      });

      return successResponse(null, "Tanda tangan berhasil disimpan.");
    } catch (e) {
      console.error(e);
      return errorResponse("Gagal menyimpan profil.", 500);
    }
  });
}
