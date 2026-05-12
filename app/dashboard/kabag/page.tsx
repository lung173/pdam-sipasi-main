/**
 * @file app/dashboard/kabag/page.tsx
 * @description Dashboard utama untuk role Kepala Bagian (KABAG).
 * Menampilkan daftar disposisi masuk dari Direktur dan ringkasan status dokumen terkait.
 */
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { 
  ClipboardList, 
  Clock, 
  Eye, 
  ArrowRight,
  FileText,
  AlertCircle
} from "lucide-react";

export default async function KabagDashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user.role !== "KABAG" && session.user.role !== "KASUBAG")) {
    redirect("/dashboard");
  }

  // Ambil dokumen yang memiliki disposisi ke user ini (berdasarkan keId atau jabatan)
  // Catatan: Di sistem ini, Direktur biasanya mengisi 'jabatanKe' secara manual, 
  // namun jika user dikaitkan lewat 'keId', itu lebih akurat.
  const [disposisiAktif, totalSelesai, recentDisposisi] = await Promise.all([
    prisma.lembarDisposisi.count({
      where: {
        OR: [
          { keId: session.user.id },
          { jabatanKe: { contains: "Kabag", mode: "insensitive" } },
          { jabatanKe: { contains: session.user.divisi || "umum", mode: "insensitive" } }
        ],
        suratMasuk: { NOT: { currentStatus: "ARSIP_FINAL_TERSIMPAN" } }
      }
    }),
    prisma.lembarDisposisi.count({
      where: {
        OR: [
          { keId: session.user.id },
          { jabatanKe: { contains: "Kabag", mode: "insensitive" } }
        ],
        suratMasuk: { currentStatus: "ARSIP_FINAL_TERSIMPAN" }
      }
    }),
    prisma.lembarDisposisi.findMany({
      where: {
        OR: [
          { keId: session.user.id },
          { jabatanKe: { contains: "Kabag", mode: "insensitive" } },
          { jabatanKe: { contains: session.user.divisi || "umum", mode: "insensitive" } }
        ]
      },
      include: {
        suratMasuk: {
          include: {
            createdBy: { select: { name: true, divisi: true } }
          }
        },
        dari: { select: { name: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 10
    })
  ]);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard {session.user.role === "KABAG" ? "Kepala Bagian" : "Kepala Sub Bagian"}</h1>
          <p className="page-subtitle">Pantau disposisi dan instruksi dari Direktur Utama</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          title="Disposisi Aktif" 
          value={disposisiAktif} 
          icon={ClipboardList} 
          color="blue" 
          subtitle="Perlu tindak lanjut" 
        />
        <StatCard 
          title="Sudah Selesai" 
          value={totalSelesai} 
          icon={FileText} 
          color="green" 
          subtitle="Telah diarsipkan" 
        />
        <StatCard 
          title="Instruksi Baru" 
          value={recentDisposisi.length > 0 ? 1 : 0} 
          icon={AlertCircle} 
          color="orange" 
          subtitle="Minggu ini" 
        />
      </div>

      {/* List Disposisi */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Disposisi Masuk Terbaru</h2>
          <Link href="/dashboard/kabag/disposisi" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            Lihat semua <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentDisposisi.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Clock}
              title="Belum ada disposisi"
              description="Anda belum menerima instruksi disposisi dari Direktur Utama."
            />
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentDisposisi.map((disp) => (
              <div key={disp.id} className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-5 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                      {disp.suratMasuk.nomorSurat}
                    </span>
                    <StatusBadge status={disp.suratMasuk.currentStatus} size="sm" />
                  </div>
                  <p className="text-sm font-bold text-gray-900 truncate">{disp.suratMasuk.perihal}</p>
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Instruksi Direktur:</p>
                    <p className="text-sm text-gray-700 italic">&ldquo;{disp.instruksi ? disp.instruksi : "Lakukan tindak lanjut sesuai prosedur."}&rdquo;</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Diteruskan oleh: <span className="font-medium text-gray-600">{disp.dari.name}</span> ·{" "}
                    {format(new Date(disp.createdAt), "dd MMMM yyyy", { locale: localeId })}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <Link
                    href={`/dashboard/kabag/dokumen/${disp.suratMasukId}`}
                    className="btn-secondary text-xs px-4 py-2"
                  >
                    <Eye className="w-3.5 h-3.5" /> Detail Surat
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
