// components/layout/TopBar.tsx
"use client";
import { useState, useRef, useEffect } from "react";
import { Bell, ChevronDown, Menu, LogOut, UserCog, CalendarDays, ExternalLink, Info, AlertCircle, CheckCircle2, Search } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { ROLE_LABELS } from "@/types";
import { UserRole } from "@prisma/client";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";

/**
 * @file components/layout/TopBar.tsx
 * @description Header utama aplikasi yang berisi informasi user, tanggal, dan sistem notifikasi.
 * Memuat notifikasi secara dinamis berdasarkan role user untuk memberikan pengingat aksi yang diperlukan.
 */

interface Notification {
  id: string;
  title: string;
  message: string;
  link: string;
  type: string;
}

interface Props {
  user: {
    name: string;
    email: string;
    role: UserRole;
    title?: string | null;
    image?: string | null;
  };
  onMenuToggle?: () => void;
}

export function TopBar({ user, onMenuToggle }: Props) {
  const now = new Date();
  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  useEffect(() => {
    async function fetchNotifs() {
      setLoadingNotifs(true);
      try {
        const res = await fetch("/api/notifications");
        const json = await res.json() as { success: boolean; data: Notification[] };
        if (json.success) setNotifications(json.data);
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      } finally {
        setLoadingNotifs(false);
      }
    }
    fetchNotifs();
    // Refresh every 2 minutes
    const interval = setInterval(fetchNotifs, 120000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case "urgent": return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "warning": return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case "success": return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <header className="print:hidden h-[76px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 flex items-center justify-between px-4 md:px-8 shrink-0 sticky top-0 z-30 transition-all">
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
          <h2 className="text-base md:text-lg font-bold text-gray-800 dark:text-white tracking-tight">
            Selamat datang, <span className="text-blue-600 dark:text-blue-400">{user.name}{user.title ? `, ${user.title}` : ""}!</span>
          </h2>
          <div className="flex items-center gap-1.5 text-sm font-medium text-gray-400 dark:text-slate-500 mt-0.5 hidden sm:flex" suppressHydrationWarning>
            <CalendarDays className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
            {mounted ? format(now, "EEEE, dd MMMM yyyy", { locale: localeId }) : "..."}
          </div>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const q = (e.currentTarget.elements.namedItem("q") as HTMLInputElement).value;
            if (q) window.location.href = `/dashboard/search?q=${encodeURIComponent(q)}`;
          }}
          className="relative w-full group"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" />
          <input
            name="q"
            type="text"
            placeholder="Cari nomor surat atau perihal..."
            className="w-full bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/30 transition-all"
            suppressHydrationWarning
          />
        </form>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Theme Switcher */}
        <ThemeToggle />
        
        <div className="w-px h-6 bg-gray-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>
        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className={cn(
              "relative p-2.5 text-gray-400 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-all",
              notifOpen && "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-slate-800"
            )}
            suppressHydrationWarning
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white ring-2 ring-red-500/30 animate-pulse" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl shadow-gray-200/50 dark:shadow-black/20 border border-gray-100 dark:border-slate-700 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 pb-2 border-b border-gray-50 dark:border-slate-700/50 mb-2 flex items-center justify-between">
                <p className="text-sm font-bold text-gray-800 dark:text-white">Notifikasi</p>
                <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-bold">
                  {notifications.length} Baru
                </span>
              </div>
              <div className="max-h-[350px] overflow-y-auto px-2">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center">
                    <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Tidak ada notifikasi baru</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <Link
                      key={n.id}
                      href={n.link}
                      onClick={() => setNotifOpen(false)}
                      className="flex gap-3 p-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors group mb-1"
                    >
                      <div className="mt-0.5">{getIcon(n.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{n.title}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 leading-normal mt-0.5 line-clamp-2">{n.message}</p>
                      </div>
                      <ExternalLink className="w-3 h-3 text-gray-300 group-hover:text-blue-400 mt-1" />
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
 
        <div className="w-px h-8 bg-gray-200 dark:bg-slate-700 hidden sm:block"></div>

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={cn(
              "flex items-center gap-3 p-1.5 pr-2 rounded-xl transition-all focus:outline-none border",
              dropdownOpen ? "bg-blue-50 dark:bg-slate-800 border-blue-100 dark:border-blue-900/50" : "hover:bg-gray-50 dark:hover:bg-slate-800 border-transparent"
            )}
            suppressHydrationWarning
          >
            {user.image ? (
              <img
                src={user.image}
                alt={user.name}
                className="w-9 h-9 rounded-full object-cover shadow-sm border border-gray-200"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 text-white flex items-center justify-center text-sm font-bold shadow-sm shadow-blue-200">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-gray-800 dark:text-white leading-tight">
                {user.name}{user.title ? `, ${user.title}` : ""}
              </p>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400 leading-tight mt-0.5">{ROLE_LABELS[user.role]}</p>
            </div>
            <ChevronDown className={cn(
              "w-4 h-4 text-gray-400 transition-transform ml-1 hidden sm:block",
              dropdownOpen && "rotate-180 text-blue-600"
            )} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl shadow-gray-200/50 dark:shadow-black/30 border border-gray-100 dark:border-slate-700 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-2 border-b border-gray-50 dark:border-slate-700 mb-2 sm:hidden">
                <p className="text-sm font-semibold text-gray-800 dark:text-white">{user.name}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">{ROLE_LABELS[user.role]}</p>
              </div>

              <Link
                href="/dashboard/profil"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700/50 transition-colors mx-2 rounded-lg"
              >
                <UserCog className="w-4 h-4" />
                Pengaturan Profil
              </Link>
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
