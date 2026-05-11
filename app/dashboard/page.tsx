/**
 * @file app/dashboard/page.tsx
 * @description Halaman pengalihan (redirect) utama dashboard.
 * Berfungsi untuk mengarahkan user ke halaman dashboard yang sesuai berdasarkan role masing-masing setelah login.
 */
// app/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { redirect } from "next/navigation";

export default async function DashboardRedirect() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const roleMap: Record<string, string> = {
    ADMIN_STAFF: "/dashboard/staff",
    AGENDARIS:   "/dashboard/admin",
    DIREKTUR:    "/dashboard/direktur",
    KABAG:       "/dashboard/kabag",
    KASUBAG:     "/dashboard/kabag", // Kasubag for now uses same kabag logic or similar
  };

  redirect(roleMap[session.user.role] ?? "/login");
}
