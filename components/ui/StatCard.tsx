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
  blue:   { bg: "bg-blue-50/50 dark:bg-blue-900/10",   icon: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",   text: "text-blue-700 dark:text-blue-400" },
  green:  { bg: "bg-green-50/50 dark:bg-green-900/10",  icon: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",  text: "text-green-700 dark:text-green-400" },
  yellow: { bg: "bg-yellow-50/50 dark:bg-yellow-900/10", icon: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400", text: "text-yellow-700 dark:text-yellow-400" },
  red:    { bg: "bg-red-50/50 dark:bg-red-900/10",    icon: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",      text: "text-red-700 dark:text-red-400" },
  purple: { bg: "bg-purple-50/50 dark:bg-purple-900/10", icon: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400", text: "text-purple-700 dark:text-purple-400" },
  orange: { bg: "bg-orange-50/50 dark:bg-orange-900/10", icon: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400", text: "text-orange-700 dark:text-orange-400" },
};

export function StatCard({ title, value, icon: Icon, color = "blue", subtitle }: Props) {
  const c = colorMap[color];
  return (
    <div className={cn("card p-5 flex items-center gap-4", c.bg)}>
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", c.icon)}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-gray-600 dark:text-slate-400">{title}</p>
        <p className={cn("text-2xl font-bold", c.text)}>{value}</p>
        {subtitle && <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
