// components/documents/DocumentTable.tsx
"use client";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Eye, ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { DocumentListItem } from "@/types";

interface Props {
  documents: DocumentListItem[];
  basePath?: string;
  emptyTitle?: string;
  emptyDesc?: string;
  showCreator?: boolean;
}

export function DocumentTable({
  documents,
  basePath = "/dashboard",
  emptyTitle = "Tidak ada dokumen",
  emptyDesc = "Belum ada dokumen yang tersedia.",
  showCreator = true,
}: Props) {
  if (!documents.length) {
    return <EmptyState title={emptyTitle} description={emptyDesc} />;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="table-th rounded-tl-xl">No. Surat</th>
            <th className="table-th">Perihal</th>
            {showCreator && <th className="table-th">Dari</th>}
            <th className="table-th">Tanggal</th>
            <th className="table-th">Status</th>
            <th className="table-th rounded-tr-xl text-center">Aksi</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {documents.map((doc) => (
            <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
              <td className="table-td font-mono text-xs font-medium text-blue-700 whitespace-nowrap">
                {doc.nomorSurat}
              </td>
              <td className="table-td max-w-xs">
                <p className="truncate font-medium text-gray-900">{doc.perihal}</p>
                {doc.tujuan && (
                  <p className="text-xs text-gray-400 truncate mt-0.5">Kepada: {doc.tujuan}</p>
                )}
              </td>
              {showCreator && (
                <td className="table-td whitespace-nowrap">
                  <p className="font-medium">{doc.createdBy.name}</p>
                  <p className="text-xs text-gray-400">{doc.createdBy.divisi ?? "-"}</p>
                </td>
              )}
              <td className="table-td whitespace-nowrap text-gray-500">
                {format(new Date(doc.tanggalSurat), "dd MMM yyyy", { locale: localeId })}
              </td>
              <td className="table-td">
                <StatusBadge status={doc.currentStatus} size="sm" />
              </td>
              <td className="table-td text-center">
                <Link
                  href={`${basePath}/dokumen/${doc.id}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium
                             text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Detail
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
