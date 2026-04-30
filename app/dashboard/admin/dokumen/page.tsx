// app/dashboard/admin/dokumen/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DocumentTable } from "@/components/documents/DocumentTable";
import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";

export default async function AdminSemuaDokumenPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "AGENDARIS") redirect("/dashboard");

  const documents = await prisma.suratMasuk.findMany({
    include: {
      createdBy: { select: { id: true, name: true, divisi: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/admin" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="page-title flex items-center gap-2">
              <FileText className="w-6 h-6 text-purple-600" />
              Semua Dokumen
            </h1>
            <p className="page-subtitle">
              Ruang otoritas Administrator untuk memantau semua dokumen dari segala Role.
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="p-4">
          <DocumentTable
            documents={documents}
            basePath="/dashboard/admin" // Assuming detail url is /dashboard/admin/dokumen/[id] or wait! Admin detail is /dashboard/admin/arsip/[id] usually?
            showCreator={true}
            emptyTitle="Tidak ada data"
            emptyDesc="Sistem belum memiliki dokumen satupun."
          />
        </div>
      </div>
    </div>
  );
}
