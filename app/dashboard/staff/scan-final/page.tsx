// app/dashboard/staff/scan-final/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DocumentTable } from "@/components/documents/DocumentTable";
import { ScanText, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function ScanFinalPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN_STAFF") redirect("/dashboard");

  const documents = await prisma.suratMasuk.findMany({
    where: {
      createdById: session.user.id,
      currentStatus: "MENUNGGU_SCAN_FINAL",
    },
    include: {
      createdBy: { select: { id: true, name: true, divisi: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/staff" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="page-title flex items-center gap-2">
              <ScanText className="w-6 h-6 text-green-600" />
              Menunggu Scan Final
            </h1>
            <p className="page-subtitle">
              Dokumen yang telah disetujui Direktur dan memerlukan unggahan file Scan PDF resmi.
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="p-4">
          <DocumentTable
            documents={documents}
            basePath="/dashboard/staff"
            showCreator={false}
            emptyTitle="Tidak ada dokumen siap scan"
            emptyDesc="Belum ada dokumen Anda yang mencapai tahap ini."
          />
        </div>
      </div>
    </div>
  );
}
