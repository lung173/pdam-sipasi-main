// app/dashboard/agendaris/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { StatCard } from "@/components/ui/StatCard";
import { DocumentTable } from "@/components/documents/DocumentTable";
import { ArrowRight, Inbox, Send, Clock, CheckCircle } from "lucide-react";

export default async function AgendarisDashboard() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "AGENDARIS") redirect("/dashboard");

  const [masuk, diteruskan, menungguPengambilan, selesaiToday, recent] = await Promise.all([
    prisma.suratMasuk.count({ where: { currentStatus: "MENUNGGU_REVIEW_AGENDARIS" } }),
    prisma.suratMasuk.count({ where: { currentStatus: "MENUNGGU_KEPUTUSAN_DIREKTUR" } }),
    prisma.suratMasuk.count({ where: { currentStatus: "MENUNGGU_PENGAMBILAN_STAFF" } }),
    prisma.documentReview.count({
      where: {
        reviewedById: session.user.id,
        reviewedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
    prisma.suratMasuk.findMany({
      where: {
        currentStatus: {
          in: ["MENUNGGU_REVIEW_AGENDARIS", "KEPUTUSAN_DIREKTUR_SELESAI", "MENUNGGU_PENGAMBILAN_STAFF"],
        },
      },
      include: { createdBy: { select: { id: true, name: true, divisi: true } } },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Agendaris</h1>
          <p className="page-subtitle">Pantau dan proses dokumen masuk</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Dokumen Masuk"       value={masuk}             icon={Inbox}        color="yellow" subtitle="Menunggu review" />
        <StatCard title="Diteruskan Direktur" value={diteruskan}        icon={Send}         color="blue"   subtitle="Menunggu keputusan" />
        <StatCard title="Menunggu Pengambilan"value={menungguPengambilan}icon={Clock}        color="orange" subtitle="Staff belum ambil" />
        <StatCard title="Review Hari Ini"     value={selesaiToday}      icon={CheckCircle}  color="green"  subtitle="Sudah diproses" />
      </div>

      {/* Alert inbox */}
      {masuk > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Inbox className="w-5 h-5 text-yellow-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-yellow-900">
                {masuk} dokumen menunggu review Anda
              </p>
              <p className="text-xs text-yellow-700">Segera periksa kelengkapan dokumen.</p>
            </div>
          </div>
          <Link href="/dashboard/agendaris/inbox" className="btn-primary bg-yellow-600 hover:bg-yellow-700 text-xs">
            Buka Inbox <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Dokumen Memerlukan Perhatian</h2>
          <Link href="/dashboard/agendaris/dokumen" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            Semua dokumen <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="p-4">
          <DocumentTable
            documents={recent}
            basePath="/dashboard/agendaris"
            emptyTitle="Tidak ada dokumen menunggu"
            emptyDesc="Semua dokumen sudah diproses."
          />
        </div>
      </div>
    </div>
  );
}
