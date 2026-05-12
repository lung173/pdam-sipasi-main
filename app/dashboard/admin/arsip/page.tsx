// app/dashboard/admin/arsip/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Archive, Eye, CheckCircle, ArrowLeft } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ArsipFilter } from "@/components/documents/ArsipFilter";
import { Suspense } from "react";

type Props = { searchParams: Promise<{ bulan?: string; tahun?: string }> };

export default async function AdminArsipPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "AGENDARIS") redirect("/dashboard");

  const { bulan, tahun } = await searchParams;
  const bulanNum = bulan ? parseInt(bulan) : undefined;
  const tahunNum = tahun ? parseInt(tahun) : undefined;

  const archiveFilter = {
    ...(bulanNum ? { bulan: bulanNum } : {}),
    ...(tahunNum ? { tahun: tahunNum } : {}),
  };

  const [antrianDocs, archivedDocs] = await Promise.all([
    prisma.suratMasuk.findMany({
      where: { currentStatus: "MENUNGGU_ARSIP_ADMIN" },
      include: {
        createdBy: { select: { name: true, divisi: true } },
        files: { where: { fileType: "FINAL_SCAN" }, select: { filePath: true, fileName: true } },
        decisions: {
          include: { director: { select: { name: true } } },
          orderBy: { decidedAt: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "asc" },
    }),
    prisma.suratMasuk.findMany({
      where: {
        currentStatus: "ARSIP_FINAL_TERSIMPAN",
        ...(Object.keys(archiveFilter).length > 0 ? { archive: archiveFilter } : {}),
      },
      include: {
        createdBy: { select: { name: true, divisi: true } },
        archive: { select: { archivedAt: true, serverLocation: true, bulan: true, tahun: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/admin" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="page-title">Pengarsipan Digital</h1>
          <p className="page-subtitle">Kelola dan arsipkan dokumen final ke database/server</p>
        </div>
      </div>

      {/* Antrian Arsip */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Archive className="w-5 h-5 text-teal-600" />
            <h2 className="font-semibold text-gray-900">Antrian Arsip</h2>
            {antrianDocs.length > 0 && (
              <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs font-bold rounded-full">
                {antrianDocs.length}
              </span>
            )}
          </div>
        </div>

        {antrianDocs.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={CheckCircle}
              title="Tidak ada antrian arsip"
              description="Semua dokumen sudah diarsipkan."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-th">No. Surat</th>
                  <th className="table-th">Perihal</th>
                  <th className="table-th">Dari</th>
                  <th className="table-th">Keputusan Direktur</th>
                  <th className="table-th">File Scan</th>
                  <th className="table-th text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {antrianDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="table-td font-mono text-xs text-blue-700 whitespace-nowrap">
                      {doc.nomorSurat}
                    </td>
                    <td className="table-td max-w-xs">
                      <p className="font-medium truncate">{doc.perihal}</p>
                    </td>
                    <td className="table-td whitespace-nowrap">
                      <p className="font-medium">{doc.createdBy.name}</p>
                      <p className="text-xs text-gray-400">{doc.createdBy.divisi ?? "-"}</p>
                    </td>
                    <td className="table-td">
                      {doc.decisions[0] ? (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          doc.decisions[0].decisionType === "DISETUJUI"
                            ? "bg-green-100 text-green-700"
                            : doc.decisions[0].decisionType === "DITOLAK"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {doc.decisions[0].decisionType}
                        </span>
                      ) : <span className="text-gray-400 text-xs">-</span>}
                    </td>
                    <td className="table-td">
                      {doc.files.length > 0 ? (
                        <a
                          href={doc.files[0].filePath}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline text-xs flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> Lihat Scan
                        </a>
                      ) : (
                        <span className="text-red-500 text-xs">Belum ada</span>
                      )}
                    </td>
                    <td className="table-td text-center">
                      <Link
                        href={`/dashboard/admin/arsip/${doc.id}`}
                        className="btn-primary text-xs px-3 py-1.5"
                      >
                        <Archive className="w-3.5 h-3.5" /> Arsipkan
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Riwayat arsip */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-gray-900">Riwayat Arsip Tersimpan</h2>
          <Suspense>
            <ArsipFilter />
          </Suspense>
        </div>
        {archivedDocs.length === 0 ? (
          <div className="p-4">
            <EmptyState title="Belum ada arsip" description="Dokumen yang diarsipkan akan muncul di sini." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-th">No. Surat</th>
                  <th className="table-th">Perihal</th>
                  <th className="table-th">Dari</th>
                  <th className="table-th">Lokasi Arsip</th>
                  <th className="table-th">Tanggal Arsip</th>
                  <th className="table-th text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {archivedDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="table-td font-mono text-xs text-blue-700">{doc.nomorSurat}</td>
                    <td className="table-td max-w-xs">
                      <p className="truncate font-medium">{doc.perihal}</p>
                    </td>
                    <td className="table-td">{doc.createdBy.name}</td>
                    <td className="table-td">
                      <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                        {doc.archive?.serverLocation ?? "-"}
                      </code>
                    </td>
                    <td className="table-td whitespace-nowrap text-gray-500">
                      {doc.archive
                        ? format(new Date(doc.archive.archivedAt), "dd MMM yyyy", { locale: localeId })
                        : "-"}
                    </td>
                    <td className="table-td">
                      <StatusBadge status={doc.currentStatus} size="sm" />
                    </td>
                    <td className="table-td text-center">
                      <Link
                        href={`/dashboard/admin/arsip/${doc.id}`}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors font-medium border border-blue-100"
                      >
                        <Eye className="w-3.5 h-3.5" /> Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
