// app/dashboard/direktur/page.tsx
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
import { DECISION_LABELS } from "@/types";
import { DecisionType } from "@prisma/client";
import {
  ClipboardList, CheckCircle, Clock, Eye, ArrowRight,
} from "lucide-react";

export default async function DirektuurDashboard() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "DIREKTUR") redirect("/dashboard");

  const [menunggu, totalKeputusan, recentDecisions, antrianDocs] = await Promise.all([
    prisma.suratMasuk.count({ where: { currentStatus: "MENUNGGU_KEPUTUSAN_DIREKTUR" } }),
    prisma.directorDecision.count({ where: { directorId: session.user.id } }),
    prisma.directorDecision.findMany({
      where: { directorId: session.user.id },
      include: {
        suratMasuk: { select: { nomorSurat: true, perihal: true } },
      },
      orderBy: { decidedAt: "desc" },
      take: 5,
    }),
    prisma.suratMasuk.findMany({
      where: { currentStatus: "MENUNGGU_KEPUTUSAN_DIREKTUR" },
      include: { createdBy: { select: { name: true, divisi: true } } },
      orderBy: { updatedAt: "asc" }, // FIFO
      take: 8,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Direktur Utama</h1>
          <p className="page-subtitle">Antrian dokumen menunggu keputusan Anda</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Menunggu Keputusan" value={menunggu}       icon={Clock}         color="yellow" subtitle="Perlu ditindaklanjuti" />
        <StatCard title="Total Keputusan"    value={totalKeputusan} icon={CheckCircle}   color="green"  subtitle="Sepanjang masa" />
        <StatCard title="Dalam Antrian"      value={menunggu}       icon={ClipboardList} color="blue"   subtitle="Urut terlama dahulu" />
      </div>

      {/* Antrian dokumen */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Antrian Dokumen — Perlu Keputusan</h2>
          <Link href="/dashboard/direktur/antrian" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            Lihat semua <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {antrianDocs.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={CheckCircle}
              title="Tidak ada antrian"
              description="Semua dokumen sudah diproses. Terima kasih!"
            />
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {antrianDocs.map((doc) => (
              <div key={doc.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs text-blue-700 mb-0.5">{doc.nomorSurat}</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">{doc.perihal}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Dari: {doc.createdBy.name} ({doc.createdBy.divisi ?? "-"}) ·{" "}
                    {format(new Date(doc.updatedAt), "dd MMM yyyy, HH:mm", { locale: localeId })}
                  </p>
                </div>
                <StatusBadge status={doc.currentStatus} size="sm" />
                <Link
                  href={`/dashboard/direktur/dokumen/${doc.id}`}
                  className="btn-primary text-xs px-3 py-1.5 shrink-0"
                >
                  <Eye className="w-3.5 h-3.5" /> Buka
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Riwayat keputusan */}
      {recentDecisions.length > 0 && (
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Riwayat Keputusan Terbaru</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {recentDecisions.map((d) => (
              <div key={d.id} className="flex items-center gap-4 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs text-gray-500">{d.suratMasuk.nomorSurat}</p>
                  <p className="text-sm font-medium text-gray-800 truncate">{d.suratMasuk.perihal}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  d.decisionType === "DISETUJUI" ? "bg-green-100 text-green-700" :
                  d.decisionType === "DITOLAK"   ? "bg-red-100 text-red-700" :
                  "bg-yellow-100 text-yellow-700"
                }`}>
                  {DECISION_LABELS[d.decisionType as DecisionType]}
                </span>
                <p className="text-xs text-gray-400 whitespace-nowrap">
                  {format(new Date(d.decidedAt), "dd MMM", { locale: localeId })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
