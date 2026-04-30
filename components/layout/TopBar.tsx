// components/layout/TopBar.tsx
"use client";
import { Bell, ChevronDown, Menu } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { ROLE_LABELS } from "@/types";
import { UserRole } from "@prisma/client";

interface Props {
  user: { name: string; email: string; role: UserRole };
  onMenuToggle?: () => void;
}

export function TopBar({ user, onMenuToggle }: Props) {
  const now = new Date();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 shrink-0">
      <div className="flex items-center gap-3">
        {/* Hamburger - mobile only */}
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <p className="text-sm font-medium text-gray-900">
            Selamat datang, <span className="text-blue-700">{user.name.split(" ")[0]}</span>
          </p>
          <p className="text-xs text-gray-400 hidden sm:block">
            {format(now, "EEEE, dd MMMM yyyy", { locale: localeId })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900 leading-tight">{user.name}</p>
            <p className="text-xs text-gray-400 leading-tight">{ROLE_LABELS[user.role]}</p>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </header>
  );
}
