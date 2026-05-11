// app/dashboard/admin/arsip/[id]/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminArsipDetailClient from "@/components/documents/AdminArsipDetailClient";

type Params = { params: Promise<{ id: string }> };

export default async function AdminArsipDetail(props: Params) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "AGENDARIS") redirect("/dashboard");

  const [doc, staffUsers] = await Promise.all([
    prisma.suratMasuk.findUnique({
      where: { id: params.id },
      include: {
        createdBy: { select: { id: true, name: true, divisi: true, email: true } },
        files: {
          include: { uploadedBy: { select: { name: true } } },
          orderBy: { uploadedAt: "desc" },
        },
        reviews: {
          include: { reviewedBy: { select: { name: true } } },
          orderBy: { reviewedAt: "desc" },
          take: 3,
        },
        decisions: {
          include: { director: { select: { name: true } } },
          orderBy: { decidedAt: "desc" },
          take: 1,
        },
        statusTimeline: {
          include: { changedBy: { select: { name: true } } },
          orderBy: { createdAt: "asc" },
        },
        archive: { include: { archivedBy: { select: { name: true } } } },
        disposisi: {
          include: { dari: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
    prisma.user.findMany({
      where: { isActive: true, role: { in: ["ADMIN_STAFF", "KABAG", "KASUBAG"] } },
      select: { id: true, name: true, divisi: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!doc) notFound();

  return <AdminArsipDetailClient doc={doc} staffUsers={staffUsers} />;
}
