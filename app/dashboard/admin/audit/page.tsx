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
    CREATE_SURAT: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    UPLOAD_FILE: "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400",
    REVIEW_SURAT: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400",
    DECISION_MADE: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
    ARCHIVE_SURAT: "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400",
    LOGIN: "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300",
    UPDATE_USER: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400",
    DELETE_USER: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  };

  const formatAction = (action: string) => {
    return action
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
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
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
                      {ROLE_LABELS[log.user.role as UserRole]}
                    </span>
                  </td>
                  <td className="table-td">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
                      ACTION_COLORS[log.action] ?? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}>
                      {formatAction(log.action)}
                    </span>
                  </td>
                  <td className="table-td max-w-xs">
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate font-medium">{log.description ?? "-"}</p>
                  </td>
                  <td className="table-td">
                    {log.suratMasuk ? (
                      <span className="font-mono text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 px-2 py-1 rounded">
                        {log.suratMasuk?.nomorSurat}
                      </span>
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
