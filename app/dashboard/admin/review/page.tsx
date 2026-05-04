// app/dashboard/admin/review/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DocumentTable } from "@/components/documents/DocumentTable";
import { ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";

export default async function AdminReviewHistoryPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "AGENDARIS") redirect("/dashboard");

  const documents = await prisma.suratMasuk.findMany({
    where: {
      OR: [
        { reviews: { some: { reviewedById: session.user.id } } },
        { statusTimeline: { some: { changedBy: { id: session.user.id }, fromStatus: "MENUNGGU_REVIEW_AGENDARIS" } } }
      ]
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
          <Link href="/dashboard/admin" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="page-title flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              Riwayat Review
            </h1>
            <p className="page-subtitle">
              Kumpulan dokumen yang sebelumnya sudah selesai Anda periksa dan review.
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="p-4">
          <DocumentTable
            documents={documents}
            basePath="/dashboard/admin"
            emptyTitle="Belum ada riwayat"
            emptyDesc="Anda belum pernah melakukan review pada dokumen mana pun."
          />
        </div>
      </div>
    </div>
  );
}
