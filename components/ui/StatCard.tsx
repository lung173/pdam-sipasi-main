// components/ui/StatCard.tsx
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: "blue" | "green" | "yellow" | "red" | "purple" | "orange";
  subtitle?: string;
}

const colorMap = {
  blue:   { bg: "bg-blue-50",   icon: "bg-blue-100 text-blue-700",   text: "text-blue-700" },
  green:  { bg: "bg-green-50",  icon: "bg-green-100 text-green-700",  text: "text-green-700" },
  yellow: { bg: "bg-yellow-50", icon: "bg-yellow-100 text-yellow-700",text: "text-yellow-700" },
  red:    { bg: "bg-red-50",    icon: "bg-red-100 text-red-700",      text: "text-red-700" },
  purple: { bg: "bg-purple-50", icon: "bg-purple-100 text-purple-700",text: "text-purple-700" },
  orange: { bg: "bg-orange-50", icon: "bg-orange-100 text-orange-700",text: "text-orange-700" },
};

export function StatCard({ title, value, icon: Icon, color = "blue", subtitle }: Props) {
  const c = colorMap[color];
  return (
    <div className={cn("card p-5 flex items-center gap-4", c.bg)}>
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", c.icon)}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-gray-600">{title}</p>
        <p className={cn("text-2xl font-bold", c.text)}>{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
