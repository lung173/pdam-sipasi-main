// app/dashboard/agendaris/dokumen/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DocumentTable } from "@/components/documents/DocumentTable";
import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";

export default async function AgendarisSemuaDokumenPage() {
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
          <Link href="/dashboard/agendaris" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="page-title flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              Semua Dokumen
            </h1>
            <p className="page-subtitle">
              Arsip pemantauan seluruh dokumen yang bersirkulasi di sistem PDAM.
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="p-4">
          <DocumentTable
            documents={documents}
            basePath="/dashboard/agendaris"
            emptyTitle="Tidak ada data"
            emptyDesc="Belum ada dokumen satupun di dalam sistem."
          />
        </div>
      </div>
    </div>
  );
}
