// app/dashboard/admin/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ROLE_LABELS } from "@/types";
import { UserRole } from "@prisma/client";
import {
  FileText, Users, Archive, CheckCircle, Eye, ArrowRight,
  Activity, Clock,
} from "lucide-react";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "AGENDARIS") redirect("/dashboard");

  const [
    totalDokumen, totalUser, menungguArsip, arsipFinal,
    antrian, recentAudit, docPerStatus,
  ] = await Promise.all([
    prisma.suratMasuk.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.suratMasuk.count({ where: { currentStatus: "MENUNGGU_ARSIP_ADMIN" } }),
    prisma.suratMasuk.count({ where: { currentStatus: "ARSIP_FINAL_TERSIMPAN" } }),
    prisma.suratMasuk.findMany({
      where: { currentStatus: "MENUNGGU_ARSIP_ADMIN" },
      include: { createdBy: { select: { name: true, divisi: true } } },
      orderBy: { updatedAt: "asc" },
      take: 5,
    }),
    prisma.auditLog.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, role: true } } },
    }),
    prisma.suratMasuk.groupBy({
      by: ["currentStatus"],
      _count: { currentStatus: true },
    }),
  ]);

  const statusCounts = Object.fromEntries(
    docPerStatus.map((d) => [d.currentStatus, d._count.currentStatus])
  );

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Administrator</h1>
          <p className="page-subtitle">Monitoring sistem dan pengelolaan arsip digital</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/admin/users" className="btn-secondary">
            <Users className="w-4 h-4" /> Kelola User
          </Link>
          <Link href="/dashboard/admin/arsip" className="btn-primary">
            <Archive className="w-4 h-4" /> Arsip ({menungguArsip})
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Dokumen" value={totalDokumen} icon={FileText} color="blue" />
        <StatCard title="User Aktif" value={totalUser} icon={Users} color="green" />
        <StatCard title="Antrian Arsip" value={menungguArsip} icon={Clock} color="yellow" subtitle="Perlu diarsipkan" />
        <StatCard title="Arsip Selesai" value={arsipFinal} icon={CheckCircle} color="purple" />
      </div>

      {/* Alert arsip */}
      {menungguArsip > 0 && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Archive className="w-5 h-5 text-teal-600" />
            <div>
              <p className="text-sm font-semibold text-teal-900">
                {menungguArsip} dokumen menunggu pengarsipan
              </p>
              <p className="text-xs text-teal-700">Scan final sudah ada. Segera arsipkan ke server.</p>
            </div>
          </div>
          <Link href="/dashboard/admin/arsip" className="btn-primary bg-teal-600 hover:bg-teal-700 text-xs">
            Buka Arsip <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Antrian Arsip */}
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Antrian Arsip</h2>
            <Link href="/dashboard/admin/arsip" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              Semua <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {antrian.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400">Tidak ada antrian arsip.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {antrian.map((doc) => (
                <div key={doc.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs text-blue-700">{doc.nomorSurat}</p>
                    <p className="text-sm text-gray-800 truncate">{doc.perihal}</p>
                    <p className="text-xs text-gray-400">Dari: {doc.createdBy.name}</p>
                  </div>
                  <Link href={`/dashboard/admin/arsip/${doc.id}`}
                    className="p-1.5 hover:bg-blue-50 rounded text-gray-400 hover:text-blue-600">
                    <Eye className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audit log */}
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Aktivitas Terbaru</h2>
            <Link href="/dashboard/admin/audit" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              Semua Log <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentAudit.map((log) => (
              <div key={log.id} className="flex items-start gap-3 px-5 py-3">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {log.user.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900">
                    {log.user.name}
                    <span className="text-gray-400 font-normal ml-1">
                      ({ROLE_LABELS[log.user.role as UserRole]})
                    </span>
                  </p>
                  <p className="text-xs text-gray-600 truncate">{log.description ?? log.action}</p>
                  <p className="text-xs text-gray-400">
                    {format(new Date(log.createdAt), "dd MMM, HH:mm", { locale: localeId })}
                  </p>
                </div>
                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono whitespace-nowrap">
                  {log.action}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status distribution */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-600" /> Distribusi Status Dokumen
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {Object.entries(statusCounts).map(([status, count]) => (
            <div key={status} className="text-center p-3 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <StatusBadge status={status as never} size="sm" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
