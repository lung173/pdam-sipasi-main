/**
 * @file app/dashboard/kabag/dokumen/page.tsx
 * @description Halaman pencarian dan daftar seluruh dokumen yang dapat diakses oleh KABAG.
 */
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { 
  BookOpen, 
  Eye, 
  Search,
} from "lucide-react";

export default async function KabagDocumentList() {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user.role !== "KABAG" && session.user.role !== "KASUBAG")) {
    redirect("/dashboard");
  }

  // KABAG bisa melihat semua dokumen yang sudah melewati tahap review agendaris
  // atau yang ditujukan ke mereka. Untuk sekarang, tampilkan semua dokumen non-draft.
  const documents = await prisma.suratMasuk.findMany({
    where: {
      NOT: { currentStatus: "DRAFT" }
    },
    include: {
      createdBy: { select: { name: true, divisi: true } }
    },
    orderBy: { updatedAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Arsip Dokumen</h1>
          <p className="page-subtitle">Cari dan lihat seluruh riwayat dokumen di sistem</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Cari nomor surat atau perihal..." 
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {documents.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">Belum ada dokumen yang tersedia.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Info Dokumen</th>
                  <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Pembuat</th>
                  <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-5 py-4">
                      <p className="font-mono text-[10px] text-blue-600 mb-0.5">{doc.nomorSurat}</p>
                      <p className="text-sm font-bold text-gray-900 line-clamp-1">{doc.perihal}</p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {format(new Date(doc.tanggalSurat), "dd MMMM yyyy", { locale: localeId })}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-700">{doc.createdBy.name}</p>
                      <p className="text-[10px] text-gray-400">{doc.createdBy.divisi || "-"}</p>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={doc.currentStatus} size="sm" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/dashboard/kabag/dokumen/${doc.id}`}
                        className="btn-secondary text-xs px-3 py-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" /> Lihat
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
