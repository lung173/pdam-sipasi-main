/**
 * @file app/dashboard/kabag/disposisi/page.tsx
 * @description Halaman daftar seluruh disposisi yang diterima oleh KABAG.
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
import { 
  ClipboardList, 
  Eye, 
  Search,
} from "lucide-react";

export default async function KabagDisposisiList() {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user.role !== "KABAG" && session.user.role !== "KASUBAG")) {
    redirect("/dashboard");
  }

  const disposisi = await prisma.lembarDisposisi.findMany({
    where: {
      OR: [
        { keId: session.user.id },
        { jabatanKe: { contains: "Kabag", mode: "insensitive" } },
        { jabatanKe: { contains: session.user.divisi || "umum", mode: "insensitive" } }
      ]
    },
    include: {
      suratMasuk: {
        select: { id: true, nomorSurat: true, perihal: true, currentStatus: true, asalSurat: true, tanggalSurat: true }
      },
      dari: { select: { name: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Disposisi Masuk</h1>
          <p className="page-subtitle">Daftar seluruh instruksi delegasi dari Direktur Utama</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        {disposisi.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={ClipboardList}
              title="Tidak ada data"
              description="Belum ada riwayat disposisi untuk Anda."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-40">Tgl Disposisi</th>
                  <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Info Dokumen</th>
                  <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Instruksi</th>
                  <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {disposisi.map((disp) => (
                  <tr key={disp.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="text-sm font-medium text-gray-900">
                        {format(new Date(disp.createdAt), "dd MMM yyyy", { locale: localeId })}
                      </p>
                      <p className="text-[10px] text-gray-400">{format(new Date(disp.createdAt), "HH:mm")}</p>
                    </td>
                    <td className="px-5 py-4 min-w-[240px]">
                      <p className="font-mono text-[10px] text-blue-600 mb-0.5">{disp.suratMasuk.nomorSurat}</p>
                      <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {disp.suratMasuk.perihal}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Asal: {disp.suratMasuk.asalSurat || "-"}</p>
                    </td>
                    <td className="px-5 py-4 max-w-xs">
                      <p className="text-sm text-gray-700 line-clamp-2 italic">
                        &ldquo;{disp.instruksi ? disp.instruksi : "N/A"}&rdquo;
                      </p>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <StatusBadge status={disp.suratMasuk.currentStatus} size="sm" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/dashboard/kabag/dokumen/${disp.suratMasukId}`}
                        className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        <Eye className="w-4 h-4" /> Detail
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
