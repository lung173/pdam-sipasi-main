// components/layout/TopBar.tsx
"use client";
import { useState, useRef, useEffect } from "react";
import { Bell, ChevronDown, Menu, LogOut, UserCog, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { ROLE_LABELS } from "@/types";
import { UserRole } from "@prisma/client";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Props {
  user: { name: string; email: string; role: UserRole };
  onMenuToggle?: () => void;
}

export function TopBar({ user, onMenuToggle }: Props) {
  const now = new Date();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="print:hidden h-[76px] bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-4 md:px-8 shrink-0 sticky top-0 z-30 transition-all">
      <div className="flex items-center gap-4">
        {/* Hamburger - mobile only */}
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 rounded-xl text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-base md:text-lg font-bold text-gray-800 tracking-tight">
            Selamat datang, <span className="text-blue-600">{user.name.split(" ")[0]}!</span>
          </h2>
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mt-0.5 hidden sm:flex">
            <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
            {format(now, "EEEE, dd MMMM yyyy", { locale: localeId })}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-5">
        <button className="relative p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white ring-2 ring-red-500/30" />
        </button>

        <div className="w-px h-8 bg-gray-200 hidden sm:block"></div>

        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={cn(
              "flex items-center gap-3 p-1.5 pr-2 rounded-xl transition-all focus:outline-none border",
              dropdownOpen ? "bg-blue-50 border-blue-100" : "hover:bg-gray-50 border-transparent"
            )}
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 text-white flex items-center justify-center text-sm font-bold shadow-sm shadow-blue-200">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-gray-800 leading-tight">{user.name}</p>
              <p className="text-xs font-medium text-gray-500 leading-tight mt-0.5">{ROLE_LABELS[user.role]}</p>
            </div>
            <ChevronDown className={cn(
              "w-4 h-4 text-gray-400 transition-transform ml-1 hidden sm:block",
              dropdownOpen && "rotate-180 text-blue-600"
            )} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-xl shadow-gray-200/50 border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-2 border-b border-gray-50 mb-2 sm:hidden">
                <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                <p className="text-xs text-gray-500">{ROLE_LABELS[user.role]}</p>
              </div>
              
              {user.role === "DIREKTUR" && (
                <Link
                  href="/dashboard/profil"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors mx-2 rounded-lg"
                >
                  <UserCog className="w-4 h-4" />
                  Pengaturan Profil
                </Link>
              )}
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 w-[calc(100%-1rem)] mx-2 rounded-lg text-left transition-colors mt-1"
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
