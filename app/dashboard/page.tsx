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
    KABAG:       "/dashboard/direktur/dokumen",
    KASUBAG:     "/dashboard/direktur/dokumen",
  };

  redirect(roleMap[session.user.role] ?? "/login");
}
