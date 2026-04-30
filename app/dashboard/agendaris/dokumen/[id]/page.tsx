// app/dashboard/agendaris/dokumen/[id]/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { ArrowLeft, FileText, Download, Calendar, User, Building } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatusTimeline } from "@/components/documents/StatusTimeline";
import { AgendarisActionPanel } from "@/components/documents/AgendarisActionPanel";
import { DECISION_LABELS } from "@/types";
import { DecisionType } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

export default async function AgendarisDocumentDetail(props: Params) {
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
        },
        decisions: {
          include: { director: { select: { name: true } } },
          orderBy: { decidedAt: "desc" },
          take: 1,
        },
        statusTimeline: { orderBy: { createdAt: "asc" } },
      },
    }),
    prisma.user.findMany({
      where: { isActive: true, role: { in: ["ADMIN_STAFF", "KABAG", "KASUBAG"] } },
      select: { id: true, name: true, divisi: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!doc) notFound();

  const latestDecision = doc.decisions[0];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/agendaris/inbox" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="page-title">Review Dokumen</h1>
          <p className="page-subtitle font-mono text-xs">{doc.nomorSurat}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Info */}
          <div className="card p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-bold text-gray-900">{doc.perihal}</h2>
              <StatusBadge status={doc.currentStatus} />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <InfoRow icon={FileText}  label="Nomor Surat" value={doc.nomorSurat} mono />
              <InfoRow icon={Calendar} label="Tanggal Surat"
                value={format(new Date(doc.tanggalSurat), "dd MMMM yyyy", { locale: localeId })} />
              <InfoRow icon={Building} label="Tujuan" value={doc.tujuan ?? "-"} />
              <InfoRow icon={User} label="Pengirim"
                value={`${doc.createdBy.name} (${doc.createdBy.divisi ?? "-"})`} />
            </div>
            {doc.deskripsi && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Keterangan</p>
                <p className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">{doc.deskripsi}</p>
              </div>
            )}
          </div>

          {/* Keputusan Direktur (jika sudah ada) */}
          {latestDecision && (
            <div className="card p-4 bg-purple-50 border-purple-200">
              <p className="text-sm font-semibold text-purple-900 mb-1">
                ✅ Keputusan Direktur: {DECISION_LABELS[latestDecision.decisionType as DecisionType]}
              </p>
              {latestDecision.decisionNote && (
                <p className="text-sm text-purple-700">{latestDecision.decisionNote}</p>
              )}
              <p className="text-xs text-purple-400 mt-1">
                {latestDecision.director.name} ·{" "}
                {format(new Date(latestDecision.decidedAt), "dd MMM yyyy, HH:mm", { locale: localeId })}
              </p>
            </div>
          )}

          {/* Files */}
          <div className="card p-5 space-y-3">
            <h3 className="font-semibold text-gray-900">File Lampiran</h3>
            {doc.files.length === 0 ? (
              <p className="text-sm text-red-500 font-medium">
                ⚠ Tidak ada file yang diupload oleh Staff.
              </p>
            ) : (
              <div className="space-y-2">
                {doc.files.map((f) => (
                  <div key={f.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{f.fileName}</p>
                      <p className="text-xs text-gray-400">
                        {f.fileType} · {f.uploadedBy.name}
                      </p>
                    </div>
                    <a href={f.filePath} target="_blank" rel="noreferrer"
                       className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action panel */}
          <AgendarisActionPanel doc={doc} staffUsers={staffUsers} />
        </div>

        {/* Right: timeline + riwayat review */}
        <div className="space-y-5">
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Riwayat Status</h3>
            <StatusTimeline timeline={doc.statusTimeline} />
          </div>

          {doc.reviews.length > 0 && (
            <div className="card p-5 space-y-3">
              <h3 className="font-semibold text-gray-900">Riwayat Review</h3>
              {doc.reviews.map((r) => (
                <div key={r.id} className="text-xs space-y-0.5 border-l-2 border-blue-200 pl-3">
                  <p className="font-medium">
                    {r.reviewStatus === "DITERUSKAN" ? "✅ Diteruskan" : "↩ Dikembalikan"}
                  </p>
                  {r.reviewNote && <p className="text-gray-500">{r.reviewNote}</p>}
                  <p className="text-gray-400">
                    {r.reviewedBy.name} · {format(new Date(r.reviewedAt), "dd MMM, HH:mm", { locale: localeId })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, mono }: {
  icon: React.ElementType; label: string; value: string; mono?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon className="w-3.5 h-3.5 text-gray-400" />
        <p className="text-xs font-medium text-gray-500">{label}</p>
      </div>
      <p className={`text-sm text-gray-900 ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
