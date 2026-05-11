/**
 * @file components/documents/StatusTimeline.tsx
 * @description Komponen UI untuk menampilkan riwayat status dokumen secara vertikal.
 * Memberikan visualisasi urutan proses yang telah dilalui dokumen beserta catatan dari setiap tahap.
 */
// components/documents/StatusTimeline.tsx
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { DocumentStatus } from "@prisma/client";
import { ArrowDownLeft, ArrowUpRight, Loader2, CheckCircle2 } from "lucide-react";
import { TimelineItem, STATUS_LABELS } from "@/types";

interface Props {
  timeline: TimelineItem[];
}

export function StatusTimeline({ timeline }: Props) {
  if (!timeline.length) {
    return <p className="text-sm text-gray-400 italic">Belum ada riwayat status.</p>;
  }

  return (
    <ol className="relative border-l-2 border-gray-200 ml-3 space-y-0">
      {timeline.map((item, index) => {
        const isLast = index === timeline.length - 1;
        return (
          <li key={item.id} className="ml-6 pb-6 last:pb-0">
            <span
              className={`absolute -left-[13px] flex items-center justify-center w-6 h-6 rounded-full ring-4 ring-white shadow-sm ${
                isLast ? "bg-blue-600 animate-pulse" : "bg-gray-100"
              }`}
            >
              {isLast ? (
                <Loader2 className="w-3 h-3 text-white animate-spin" />
              ) : item.toStatus.includes("MENUNGGU") ? (
                <ArrowDownLeft className="w-3 h-3 text-orange-500" />
              ) : item.toStatus.includes("SELESAI") || item.toStatus.includes("ARSIP") ? (
                <CheckCircle2 className="w-3 h-3 text-green-500" />
              ) : (
                <ArrowUpRight className="w-3 h-3 text-blue-500" />
              )}
            </span>

            <div className="pt-0.5">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                  item.toStatus.includes("MENUNGGU") ? "bg-orange-100 text-orange-700" :
                  item.toStatus.includes("ARSIP") || item.toStatus.includes("SELESAI") ? "bg-green-100 text-green-700" :
                  "bg-blue-100 text-blue-700"
                }`}>
                  {item.toStatus.includes("MENUNGGU") ? "Masuk" : 
                   item.toStatus.includes("ARSIP") || item.toStatus.includes("SELESAI") ? "Selesai" : "Keluar / Proses"}
                </span>
                <time className="text-[10px] text-gray-400">
                  {format(new Date(item.createdAt), "dd MMM yyyy, HH:mm", { locale: localeId })}
                </time>
              </div>
              <p className="text-sm font-bold text-gray-900 leading-tight">
                {STATUS_LABELS[item.toStatus as DocumentStatus] ?? item.toStatus}
              </p>
              {item.notes && (
                <p className="text-xs text-gray-600 mt-1.5 bg-gray-50 border border-gray-100 px-2 py-1.5 rounded-lg italic">
                  &ldquo;{item.notes}&rdquo;
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
