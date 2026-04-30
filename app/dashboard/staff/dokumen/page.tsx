// app/dashboard/staff/dokumen/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DocumentTable } from "@/components/documents/DocumentTable";
import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";
import { DocumentStatus } from "@prisma/client";

type PageProps = {
  searchParams: Promise<{ status?: string }>;
};

export default async function StaffSemuaDokumenPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN_STAFF") redirect("/dashboard");

  // Opsional filter berdasarkan URL Query ?status=PERLU_REVISI dll.
  const filterStatus = searchParams.status as DocumentStatus | undefined;

  const documents = await prisma.suratMasuk.findMany({
    where: {
      createdById: session.user.id,
      ...(filterStatus ? { currentStatus: filterStatus } : {}),
    },
    include: {
      createdBy: { select: { id: true, name: true, divisi: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/staff" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="page-title flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Dokumen Saya
          </h1>
          <p className="page-subtitle">
            {filterStatus 
              ? `Hanya menampilkan dokumen yang berstatus ${filterStatus.replace(/_/g, " ")}.`
              : "Daftar lengkap seluruh dokumen surat yang pernah Anda buat dan ajukan."}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="p-4">
          <DocumentTable
            documents={documents}
            basePath="/dashboard/staff"
            showCreator={false}
            emptyTitle={filterStatus ? "Tidak ada yang perlu direvisi" : "Belum ada dokumen"}
            emptyDesc={filterStatus ? "Kabar baik, tidak ada dokumen Anda yang tertahan status ini." : "Anda belum pernah mengajukan dokumen satupun."}
          />
        </div>
      </div>
    </div>
  );
}
