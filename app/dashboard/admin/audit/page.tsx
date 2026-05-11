// app/dashboard/admin/audit/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { ArrowLeft, Activity } from "lucide-react";
import { ROLE_LABELS } from "@/types";
import { UserRole } from "@prisma/client";

export default async function AuditLogPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "AGENDARIS") redirect("/dashboard");

  const logs = await prisma.auditLog.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, role: true } },
      suratMasuk: { select: { nomorSurat: true } },
    },
  });

  const ACTION_COLORS: Record<string, string> = {
    DOCUMENT_CREATED:   "bg-blue-100 text-blue-700",
    DOCUMENT_SUBMITTED: "bg-indigo-100 text-indigo-700",
    REVIEW_DITERUSKAN:  "bg-green-100 text-green-700",
    REVIEW_DIKEMBALIKAN:"bg-red-100 text-red-700",
    DIRECTOR_DECISION_DISETUJUI: "bg-emerald-100 text-emerald-700",
    DIRECTOR_DECISION_DITOLAK:   "bg-red-100 text-red-700",
    DIRECTOR_DECISION_REVISI:    "bg-yellow-100 text-yellow-700",
    DOCUMENT_ARCHIVED:  "bg-teal-100 text-teal-700",
    USER_CREATED:       "bg-purple-100 text-purple-700",
    USER_UPDATED:       "bg-orange-100 text-orange-700",
    USER_DEACTIVATED:   "bg-gray-100 text-gray-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/admin" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="page-title">Audit Log Sistem</h1>
          <p className="page-subtitle">Seluruh aktivitas pengguna di dalam sistem</p>
        </div>
      </div>

      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-gray-900">100 Aktivitas Terbaru</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="table-th">Waktu</th>
                <th className="table-th">Pengguna</th>
                <th className="table-th">Role</th>
                <th className="table-th">Aksi</th>
                <th className="table-th">Deskripsi</th>
                <th className="table-th">Dokumen</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="table-td whitespace-nowrap text-gray-400 text-xs">
                    {format(new Date(log.createdAt), "dd MMM, HH:mm:ss", { locale: localeId })}
                  </td>
                  <td className="table-td font-medium whitespace-nowrap">{log.user.name}</td>
                  <td className="table-td">
                    <span className="text-xs text-gray-500">
                      {ROLE_LABELS[log.user.role as UserRole]}
                    </span>
                  </td>
                  <td className="table-td">
                    <span className={`text-xs font-mono font-medium px-2 py-0.5 rounded ${
                      ACTION_COLORS[log.action] ?? "bg-gray-100 text-gray-600"
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="table-td max-w-xs">
                    <p className="text-xs text-gray-600 truncate">{log.description ?? "-"}</p>
                  </td>
                  <td className="table-td">
                    {log.suratMasuk ? (
                      <span className="font-mono text-xs text-blue-700">{log.suratMasuk?.nomorSurat}</span>
                    ) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && (
            <p className="text-center py-8 text-sm text-gray-400">Belum ada aktivitas.</p>
          )}
        </div>
      </div>
    </div>
  );
}
