// components/layout/Sidebar.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText, LayoutDashboard, Users, ClipboardList,
  Archive, CheckSquare, BookOpen, LogOut, FileSearch, X, UserCog
} from "lucide-react";
import { signOut } from "next-auth/react";
import { UserRole } from "@prisma/client";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const navByRole: Record<UserRole, NavItem[]> = {
  ADMIN_STAFF: [
    { label: "Dashboard",       href: "/dashboard/staff",         icon: LayoutDashboard },
    { label: "Dokumen Saya",    href: "/dashboard/staff/dokumen", icon: ClipboardList   },
  ],
  AGENDARIS: [
    { label: "Dashboard",       href: "/dashboard/admin",         icon: LayoutDashboard },
    { label: "Inbox Masuk",     href: "/dashboard/admin/inbox",   icon: ClipboardList   },
    { label: "Review Dokumen",  href: "/dashboard/admin/review",  icon: FileSearch      },
    { label: "Antrian Arsip",   href: "/dashboard/admin/arsip",   icon: Archive         },
    { label: "Semua Dokumen",   href: "/dashboard/admin/dokumen", icon: BookOpen        },
    { label: "Kelola Pengguna", href: "/dashboard/admin/users",   icon: Users           },
    { label: "Audit Log",       href: "/dashboard/admin/audit",   icon: BookOpen        },
  ],
  DIREKTUR: [
    { label: "Dashboard",          href: "/dashboard/direktur",          icon: LayoutDashboard },
    { label: "Menunggu Keputusan", href: "/dashboard/direktur/antrian",  icon: ClipboardList   },
    { label: "Riwayat Keputusan",  href: "/dashboard/direktur/riwayat", icon: CheckSquare     },
    { label: "Semua Dokumen",      href: "/dashboard/direktur/dokumen",  icon: BookOpen        },
  ],
  KABAG: [
    { label: "Semua Dokumen",   href: "/dashboard/direktur/dokumen", icon: BookOpen        },
  ],
  KASUBAG: [
    { label: "Semua Dokumen",   href: "/dashboard/direktur/dokumen", icon: BookOpen        },
  ],
};

interface Props {
  role: UserRole;
  userName: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ role, userName, isOpen = false, onClose }: Props) {
  const pathname = usePathname();
  const navItems = navByRole[role] ?? [];

  const activeHref = navItems
    .filter(item => pathname === item.href || pathname.startsWith(item.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  const roleLabel: Record<UserRole, string> = {
    ADMIN_STAFF: "Admin Staff",
    AGENDARIS:   "Agendaris",
    DIREKTUR:    "Direktur Utama",
    KABAG:       "Kepala Bagian",
    KASUBAG:     "Kepala Sub Bagian",
  };

  return (
    <aside
      className={cn(
        "print:hidden",
        "w-64 bg-blue-900 text-white flex flex-col shrink-0 z-30 transition-transform duration-300",
        /* Desktop: always visible */
        "md:relative md:translate-x-0",
        /* Mobile: fixed overlay, shown/hidden via isOpen */
        "fixed inset-y-0 left-0",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
    >
      {/* Logo + close button */}
      <div className="px-5 py-5 border-b border-blue-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm leading-tight">SIPAS PDAM</p>
            <p className="text-xs text-blue-300 leading-tight">Arsip Digital</p>
          </div>
          {/* Close button - mobile only */}
          <button
            onClick={onClose}
            className="md:hidden p-1 rounded-lg hover:bg-blue-800 text-blue-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* User info */}
      <div className="px-5 py-4 border-b border-blue-800">
        <p className="text-xs text-blue-400 mb-1">Login sebagai</p>
        <p className="font-semibold text-sm leading-tight truncate">{userName}</p>
        <span className="inline-block mt-1 text-xs bg-blue-700 px-2 py-0.5 rounded-full text-blue-100">
          {roleLabel[role]}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.href === activeHref;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                active
                  ? "bg-blue-700 text-white font-medium"
                  : "text-blue-200 hover:bg-blue-800 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>


    </aside>
  );
}
