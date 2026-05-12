/**
 * @file app/api/documents/route.ts
 * @description Handler untuk rute API dokumen (koleksi).
 * Mendukung pengambilan daftar dokumen (GET) dengan filter documentType dan paginasi, 
 * serta pembuatan dokumen baru (POST) oleh Agendaris dan Staff.
 * Agendaris bisa membuat semua 7 jenis surat.
 */
// app/api/documents/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, successResponse, errorResponse, getClientIp } from "@/lib/auth-helpers";
import { createAuditLog, createStatusTimeline } from "@/lib/audit";
import { createDocumentSchema } from "@/lib/validations";
import { DocumentStatus, DocumentType } from "@prisma/client";

// ─── GET /api/documents ──────────────────────────────────────
// Ambil daftar dokumen sesuai role, dengan filter documentType
export async function GET(req: NextRequest) {
  return requireAuth(req, async (user) => {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get("page") ?? "1");
      const limit = parseInt(searchParams.get("limit") ?? "20");
      const status = searchParams.get("status") as DocumentStatus | null;
      const search = searchParams.get("search") ?? "";
      const docType = searchParams.get("documentType") as DocumentType | null;
      const category = searchParams.get("category") ?? "";
      const skip = (page - 1) * limit;

      // Filter berdasarkan role
      const whereBase: Record<string, unknown> = {};

      if (user.role === "ADMIN_STAFF") {
        // Staff hanya lihat dokumen miliknya
        whereBase.createdById = user.id;
      }
      // Agendaris, Direktur, Kabag bisa lihat semua

      if (status) whereBase.currentStatus = status;
      if (docType) whereBase.documentType = docType;
      if (category) whereBase.category = category;
      if (search) {
        whereBase.OR = [
          { nomorSurat: { contains: search, mode: "insensitive" } },
          { perihal: { contains: search, mode: "insensitive" } },
          { asalSurat: { contains: search, mode: "insensitive" } },
        ];
      }

      const [documents, total] = await Promise.all([
        prisma.suratMasuk.findMany({
          where: whereBase,
          include: {
            createdBy: { select: { id: true, name: true, divisi: true } },
          },
          orderBy: { updatedAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.suratMasuk.count({ where: whereBase }),
      ]);

      return successResponse({
        data: documents,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      console.error("[GET /api/documents]", error);
      return errorResponse("Gagal mengambil data dokumen.", 500);
    }
  });
}

// ─── POST /api/documents ─────────────────────────────────────
// Agendaris & Staff membuat dokumen baru
// Agendaris bisa membuat semua 7 jenis surat
export async function POST(req: NextRequest) {
  return requireAuth(req, async (user, request) => {
    if (user.role !== "ADMIN_STAFF" && user.role !== "AGENDARIS" && user.role !== "DIREKTUR") {
      return errorResponse("Hanya Staff, Agendaris, atau Direktur yang dapat membuat dokumen.", 403);
    }

    try {
      const body = await request.json();
      const parsed = createDocumentSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: "Validasi gagal", errors: parsed.error.flatten().fieldErrors },
          { status: 422 }
        );
      }

      const { nomorSurat: rawNomor, perihal, deskripsi, tujuan, asalSurat, tanggalSurat, documentType, category } = parsed.data;

      // Jika staff tidak mengisi nomor surat, auto-generate nomor draft sementara
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
      const suffix = Math.floor(1000 + Math.random() * 9000);
      const typePrefix = documentType ? documentType.replace(/_/g, "-") : "DRAFT";
      const nomorSurat = rawNomor ?? `${typePrefix}-${dateStr}-${suffix}`;

      // Cek nomor surat duplikat
      const existing = await prisma.suratMasuk.findUnique({ where: { nomorSurat } });
      if (existing) {
        return errorResponse(`Nomor surat "${nomorSurat}" sudah ada dalam sistem.`, 409);
      }

      // Agendaris membuat surat: langsung status MENUNGGU_REVIEW_AGENDARIS (atau DRAFT)
      // Staff membuat surat: status DRAFT
      const initialStatus = user.role === "AGENDARIS" 
        ? "MENUNGGU_REVIEW_AGENDARIS" 
        : "DRAFT";

      const doc = await prisma.suratMasuk.create({
        data: {
          nomorSurat,
          perihal,
          deskripsi,
          tujuan,
          asalSurat,
          tanggalSurat: new Date(tanggalSurat),
          currentStatus: initialStatus,
          createdById: user.id,
          currentHolder: user.id,
          documentType: documentType ?? "SURAT_MASUK",
          category: category ?? "DLL",
        },
        include: {
          createdBy: { select: { id: true, name: true, divisi: true } },
        },
      });

      // Timeline & Audit
      await createStatusTimeline({
        suratMasukId: doc.id,
        fromStatus: null,
        toStatus: initialStatus,
        changedBy: user.id,
        notes: `Dokumen ${documentType ?? "SURAT_MASUK"} dibuat oleh ${user.role === "AGENDARIS" ? "Agendaris" : "Staff"}`,
      });

      await createAuditLog({
        userId: user.id,
        suratMasukId: doc.id,
        action: "DOCUMENT_CREATED",
        description: `Dokumen baru dibuat: ${nomorSurat} (${documentType ?? "SURAT_MASUK"})`,
        metadata: { nomorSurat, perihal, documentType },
        ipAddress: getClientIp(request),
      });

      return successResponse(doc, "Dokumen berhasil dibuat.", 201);
    } catch (error) {
      console.error("[POST /api/documents]", error);
      return errorResponse("Gagal membuat dokumen.", 500);
    }
  });
}
