// app/dashboard/direktur/antrian/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DocumentTable } from "@/components/documents/DocumentTable";
import { ArrowLeft, Clock } from "lucide-react";
import Link from "next/link";

export default async function DirekturAntrianPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "DIREKTUR") redirect("/dashboard");

  const documents = await prisma.suratMasuk.findMany({
    where: {
      currentStatus: "MENUNGGU_KEPUTUSAN_DIREKTUR",
    },
    include: {
      createdBy: { select: { id: true, name: true, divisi: true } },
    },
    orderBy: { updatedAt: "asc" }, // FIFO (first in, first out)
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/direktur" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="page-title flex items-center gap-2">
              <Clock className="w-6 h-6 text-yellow-600" />
              Antrian Keputusan
            </h1>
            <p className="page-subtitle">
              Sistem menampilkan urutan dari yang **terlama menunggu** hingga yang paling baru masuk (FIFO).
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="p-4">
          <DocumentTable
            documents={documents}
            basePath="/dashboard/direktur"
            emptyTitle="Antrian Kosong"
            emptyDesc="Belum ada dokumen yang menunggu keputusan Anda saat ini."
          />
        </div>
      </div>
    </div>
  );
}
