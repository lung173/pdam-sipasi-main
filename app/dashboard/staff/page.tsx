// app/dashboard/staff/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DocumentTable } from "@/components/documents/DocumentTable";
import {
  FileText, Clock, AlertTriangle, CheckCircle,
  ArrowRight, FileScan,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default async function StaffDashboard() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN_STAFF") redirect("/dashboard");

  const userId = session.user.id;

  const [total, draft, menunggu, revisi, menungguScan, selesai, recent] = await Promise.all([
    prisma.suratMasuk.count({ where: { createdById: userId } }),
    prisma.suratMasuk.count({ where: { createdById: userId, currentStatus: "DRAFT" } }),
    prisma.suratMasuk.count({ where: { createdById: userId, currentStatus: "MENUNGGU_REVIEW_AGENDARIS" } }),
    prisma.suratMasuk.count({ where: { createdById: userId, currentStatus: "PERLU_REVISI" } }),
    prisma.suratMasuk.count({ where: { createdById: userId, currentStatus: "MENUNGGU_SCAN_FINAL" } }),
    prisma.suratMasuk.count({ where: { createdById: userId, currentStatus: "ARSIP_FINAL_TERSIMPAN" } }),
    prisma.suratMasuk.findMany({
      where: { createdById: userId },
      include: { createdBy: { select: { id: true, name: true, divisi: true } } },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Staff</h1>
          <p className="page-subtitle">Pantau status dokumen dan surat Anda</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard title="Total Dokumen"  value={total}       icon={FileText}      color="blue" />
        <StatCard title="Draft"           value={draft}       icon={FileText}      color="yellow" />
        <StatCard title="Dalam Proses"    value={menunggu}    icon={Clock}         color="purple" />
        <StatCard title="Perlu Revisi"    value={revisi}      icon={AlertTriangle} color="red" />
        <StatCard title="Selesai"         value={selesai}     icon={CheckCircle}   color="green" />
      </div>

      {/* Alert: ada dokumen perlu revisi */}
      {revisi > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">
              {revisi} dokumen memerlukan revisi
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              Agendaris telah mengembalikan dokumen Anda. Harap segera diperbaiki dan dikirim ulang.
            </p>
          </div>
          <Link href="/dashboard/staff/dokumen?status=PERLU_REVISI" className="btn-danger text-xs px-3 py-1.5">
            Lihat <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* Alert: ada dokumen siap scan */}
      {menungguScan > 0 && (
        <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4 flex items-start gap-3">
          <FileScan className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-cyan-800">
              {menungguScan} dokumen menunggu scan final
            </p>
            <p className="text-xs text-cyan-600 mt-0.5">
              Surat fisik sudah diambil. Silakan scan dan upload dokumen final.
            </p>
          </div>
          <Link href="/dashboard/staff/scan-final" className="btn-primary text-xs px-3 py-1.5">
            Upload Scan <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* Recent documents */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Dokumen Terbaru</h2>
          <Link href="/dashboard/staff/dokumen" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            Lihat semua <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="p-4">
          <DocumentTable
            documents={recent}
            basePath="/dashboard/staff"
            showCreator={false}
            emptyTitle="Belum ada dokumen"
            emptyDesc="Mulai dengan membuat dokumen baru."
          />
        </div>
      </div>
    </div>
  );
}
