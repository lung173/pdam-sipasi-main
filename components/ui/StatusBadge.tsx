// components/ui/StatusBadge.tsx
import { DocumentStatus } from "@prisma/client";
import { STATUS_LABELS, STATUS_COLORS } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  status: DocumentStatus;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "md" }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium whitespace-nowrap",
        STATUS_COLORS[status],
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
