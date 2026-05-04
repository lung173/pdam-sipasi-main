// app/dashboard/admin/inbox/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DocumentTable } from "@/components/documents/DocumentTable";
import { ArrowLeft, Inbox } from "lucide-react";
import Link from "next/link";

export default async function AdminInboxPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "AGENDARIS") redirect("/dashboard");

  const [inboxDocs, pendingDirectorDocs, approvedDocs] = await Promise.all([
    prisma.suratMasuk.findMany({
      where: { currentStatus: "MENUNGGU_REVIEW_AGENDARIS" },
      include: { createdBy: { select: { id: true, name: true, divisi: true } } },
      orderBy: { updatedAt: "asc" },
    }),
    prisma.suratMasuk.findMany({
      where: {
        currentStatus: { in: ["MENUNGGU_KEPUTUSAN_DIREKTUR", "DIPROSES_DIREKTUR"] },
      },
      include: { createdBy: { select: { id: true, name: true, divisi: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.suratMasuk.findMany({
      where: { currentStatus: "KEPUTUSAN_DIREKTUR_SELESAI" },
      include: { createdBy: { select: { id: true, name: true, divisi: true } } },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/admin" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="page-title flex items-center gap-2">
              <Inbox className="w-6 h-6 text-yellow-600" />
              Inbox & Pantauan
            </h1>
            <p className="page-subtitle">
              Dokumen baru yang perlu Anda review, dan pantauan dokumen di meja Direktur.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-gray-900 border-l-4 border-yellow-500 pl-3">
          Menunggu Review Anda (Sekretariat / Admin)
        </h2>
        <div className="card">
          <div className="p-4">
            <DocumentTable
              documents={inboxDocs}
              basePath="/dashboard/admin" 
              emptyTitle="Inbox Kosong"
              emptyDesc="Belum ada dokumen baru yang memerlukan review."
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-gray-900 border-l-4 border-blue-500 pl-3">
          Pantauan: Di Meja Direktur
        </h2>
        <div className="card">
          <div className="p-4">
            <DocumentTable
              documents={pendingDirectorDocs}
              basePath="/dashboard/admin"
              emptyTitle="Tidak Ada Antrean"
              emptyDesc="Semua dokumen di meja Direktur sudah diputuskan."
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-gray-900 border-l-4 border-green-500 pl-3">
          Disetujui oleh Direktur
        </h2>
        <div className="card">
          <div className="p-4">
            <DocumentTable
              documents={approvedDocs}
              basePath="/dashboard/admin"
              emptyTitle="Belum Ada"
              emptyDesc="Tidak ada dokumen yang baru disetujui Direktur saat ini."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
