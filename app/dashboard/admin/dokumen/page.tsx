// app/dashboard/admin/dokumen/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DocumentTable } from "@/components/documents/DocumentTable";
import { DokumenSearch } from "@/components/documents/DokumenSearch";
import { Pagination } from "@/components/ui/Pagination";
import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";
import { Prisma } from "@prisma/client";
import { Suspense } from "react";

const PAGE_SIZE = 10;

type Params = { searchParams: Promise<{ q?: string; date?: string; page?: string }> };

export default async function AdminSemuaDokumenPage(props: Params) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "AGENDARIS") redirect("/dashboard");

  const searchParams = await props.searchParams;
  const q = searchParams.q ?? "";
  const date = searchParams.date ?? "";
  const page = Math.max(1, parseInt(searchParams.page ?? "1") || 1);

  const where: Prisma.SuratMasukWhereInput = {};

  if (q) {
    where.OR = [
      { perihal: { contains: q, mode: "insensitive" } },
      { asalSurat: { contains: q, mode: "insensitive" } },
      { nomorSurat: { contains: q, mode: "insensitive" } },
      { createdBy: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    where.tanggalSurat = {
      gte: startOfDay,
      lte: endOfDay,
    };
  }

  const [totalItems, documents] = await Promise.all([
    prisma.suratMasuk.count({ where }),
    prisma.suratMasuk.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true, divisi: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/admin" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="page-title flex items-center gap-2">
              <FileText className="w-6 h-6 text-purple-600" />
              Semua Dokumen
            </h1>
            <p className="page-subtitle">
              Ruang otoritas Administrator untuk memantau semua dokumen dari segala Role.
            </p>
          </div>
        </div>
      </div>

      <DokumenSearch />

      <div className="card">
        <div className="p-4 space-y-4">
          <DocumentTable
            documents={documents}
            basePath="/dashboard/admin/arsip"
            showCreator={true}
            emptyTitle={q || date ? "Pencarian tidak ditemukan" : "Tidak ada data"}
            emptyDesc={q || date ? "Tidak ada dokumen yang sesuai dengan kata kunci atau tanggal pencarian." : "Sistem belum memiliki dokumen satupun."}
          />
          <Suspense>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={PAGE_SIZE}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
