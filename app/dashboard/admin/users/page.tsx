// app/dashboard/admin/users/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Users, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ROLE_LABELS } from "@/types";
import { UserRole } from "@prisma/client";
import { UserManagementClient } from "@/components/admin/UserManagementClient";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "AGENDARIS") redirect("/dashboard");

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      divisi: true,
      isActive: true,
      createdAt: true,
      _count: { select: { suratMasukCreated: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/admin" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="page-title">Kelola Pengguna</h1>
          <p className="page-subtitle">CRUD akun pengguna sistem</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(["ADMIN_STAFF", "AGENDARIS", "DIREKTUR"] as UserRole[]).map((role) => {
          const count = users.filter((u) => u.role === role && u.isActive).length;
          return (
            <div key={role} className="card p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-xs text-gray-500 mt-1">{ROLE_LABELS[role]}</p>
            </div>
          );
        })}
      </div>

      {/* Client component for CRUD */}
      <UserManagementClient
        initialUsers={users.map((u) => ({
          ...u,
          createdAt: u.createdAt.toISOString(),
          docCount: u._count.suratMasukCreated,
        }))}
        currentUserId={session.user.id}
      />
    </div>
  );
}
