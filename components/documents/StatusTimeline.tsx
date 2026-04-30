// components/documents/StatusTimeline.tsx
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CheckCircle2, Circle } from "lucide-react";
import { TimelineItem } from "@/types";
import { STATUS_LABELS } from "@/types";
import { DocumentStatus } from "@prisma/client";

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
              className={`absolute -left-[11px] flex items-center justify-center w-5 h-5 rounded-full ring-2 ring-white ${
                isLast ? "bg-blue-600" : "bg-green-500"
              }`}
            >
              {isLast ? (
                <Circle className="w-2.5 h-2.5 text-white fill-white" />
              ) : (
                <CheckCircle2 className="w-2.5 h-2.5 text-white" />
              )}
            </span>

            <div className="pt-0.5">
              <p className="text-sm font-semibold text-gray-900">
                {STATUS_LABELS[item.toStatus as DocumentStatus] ?? item.toStatus}
              </p>
              {item.fromStatus && (
                <p className="text-xs text-gray-400">
                  dari: {STATUS_LABELS[item.fromStatus as DocumentStatus] ?? item.fromStatus}
                </p>
              )}
              {item.notes && (
                <p className="text-xs text-gray-600 mt-1 bg-gray-50 px-2 py-1 rounded">
                  {item.notes}
                </p>
              )}
              <time className="text-xs text-gray-400 mt-1 block">
                {format(new Date(item.createdAt), "dd MMM yyyy, HH:mm", { locale: localeId })}
              </time>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
