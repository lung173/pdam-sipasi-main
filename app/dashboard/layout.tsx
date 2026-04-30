// app/dashboard/layout.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <DashboardShell
      role={session.user.role}
      userName={session.user.name}
      user={session.user}
    >
      {children}
    </DashboardShell>
  );
}
