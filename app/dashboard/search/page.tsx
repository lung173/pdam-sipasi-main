/**
 * @file app/dashboard/search/page.tsx
 * @description Halaman pencarian global untuk menemukan dokumen di seluruh sistem tanpa batasan status.
 */
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Search, FileText, Calendar, User, ArrowRight, Eye, Briefcase } from "lucide-react";
import { Prisma } from "@prisma/client";

type Params = { searchParams: Promise<{ q?: string }> };

export default async function GlobalSearchPage(props: Params) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const searchParams = await props.searchParams;
  const q = searchParams.q ?? "";

  // Logic: AGENDARIS, DIREKTUR, ADMIN bisa lihat semua. 
  // Staff hanya bisa lihat miliknya sendiri (demi keamanan data antar staf).
  const isPowerUser = ["AGENDARIS", "DIREKTUR"].includes(session.user.role);

  const where: Prisma.SuratMasukWhereInput = {};
  
  if (q) {
    where.AND = [
      {
        OR: [
          { perihal: { contains: q, mode: "insensitive" } },
          { nomorSurat: { contains: q, mode: "insensitive" } },
          { asalSurat: { contains: q, mode: "insensitive" } },
          { tujuan: { contains: q, mode: "insensitive" } },
          { deskripsi: { contains: q, mode: "insensitive" } },
          { nomorAgenda: { contains: q, mode: "insensitive" } },
          { createdBy: { name: { contains: q, mode: "insensitive" } } },
        ]
      }
    ];
  }

  // Filter privasi untuk Staff
  if (!isPowerUser) {
    const currentAnd = (where.AND as Prisma.SuratMasukWhereInput[]) || [];
    where.AND = [...currentAnd, { createdById: session.user.id }];
  }

  const results = await prisma.suratMasuk.findMany({
    where,
    include: {
      createdBy: { select: { name: true, divisi: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 50, // Batasi hasil pencarian
  });

  // Base path untuk detail dokumen berbeda-beda tiap role
  const getDetailPath = (id: string) => {
    switch (session.user.role) {
      case "AGENDARIS": return `/dashboard/admin/arsip/${id}`;
      case "DIREKTUR":  return `/dashboard/direktur/dokumen/${id}`;
      case "KABAG":     return `/dashboard/kabag/dokumen/${id}`;
      case "KASUBAG":   return `/dashboard/kabag/dokumen/${id}`;
      default:          return `/dashboard/staff/dokumen/${id}`;
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Search className="w-6 h-6 text-blue-600" />
            Hasil Pencarian
          </h1>
          <p className="page-subtitle">
            {q ? `Menampilkan hasil untuk "${q}"` : "Masukkan kata kunci untuk mencari dokumen"}
          </p>
        </div>
      </div>

      {!q ? (
        <div className="card p-12 text-center">
           <Search className="w-12 h-12 text-gray-200 mx-auto mb-3" />
           <p className="text-gray-500">Silakan ketikkan perihal, nomor surat, atau pengirim pada kolom pencarian di atas.</p>
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Tidak ditemukan"
          description={`Kami tidak menemukan dokumen yang cocok dengan "${q}". Pastikan ejaan benar.`}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Ditemukan {results.length} Dokumen</p>
          {results.map((doc) => (
            <div key={doc.id} className="card group hover:border-blue-200 transition-all shadow-sm hover:shadow-md">
              <div className="p-5 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold">
                      {doc.nomorSurat}
                    </span>
                    <StatusBadge status={doc.currentStatus} size="sm" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                    {doc.perihal}
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(new Date(doc.tanggalSurat), "dd MMM yyyy", { locale: localeId })}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <User className="w-3.5 h-3.5" />
                      {doc.asalSurat || "N/A"}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Briefcase className="w-3.5 h-3.5" />
                      {doc.createdBy.name} ({doc.createdBy.divisi || "-"})
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0">
                  <Link
                    href={getDetailPath(doc.id)}
                    className="btn-primary w-full md:w-auto text-xs px-5 py-2.5 flex items-center justify-center gap-2"
                  >
                    <Eye className="w-3.5 h-3.5" /> Lihat Detail
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
