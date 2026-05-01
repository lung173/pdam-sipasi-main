// app/dashboard/staff/dokumen/[id]/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { ArrowLeft, FileText, Download, User, Calendar, Building } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatusTimeline } from "@/components/documents/StatusTimeline";
import { FileUpload } from "@/components/documents/FileUpload";
import { StaffActionPanel } from "@/components/documents/StaffActionPanel";
import { DisposisiViewer } from "@/components/documents/DisposisiViewer";
import { DECISION_LABELS } from "@/types";
import { DecisionType } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

export default async function StaffDocumentDetail(props: Params) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN_STAFF") redirect("/dashboard");

  const doc = await prisma.suratMasuk.findUnique({
    where: { id: params.id },
    include: {
      createdBy: { select: { id: true, name: true, divisi: true, role: true } },
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
      disposisi: {
        include: {
          dari: { select: { name: true } },
          ke:   { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      statusTimeline: { orderBy: { createdAt: "asc" } },
      archive: { include: { archivedBy: { select: { name: true } } } },
    },
  });

  if (!doc) notFound();
  if (doc.createdById !== session.user.id) redirect("/dashboard/staff");

  const latestDecision = doc.decisions[0];
  const latestReview   = doc.reviews[0];
  const latestDisposisi = doc.disposisi[0] ?? null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/staff/dokumen" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="page-title">Detail Dokumen</h1>
          <p className="page-subtitle font-mono text-xs">{doc.nomorSurat}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: main info */}
        <div className="lg:col-span-2 space-y-5">

          {/* Info card */}
          <div className="card p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-bold text-gray-900">{doc.perihal}</h2>
              <StatusBadge status={doc.currentStatus} />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <InfoRow icon={FileText} label="Nomor Surat" value={doc.nomorSurat} mono />
              <InfoRow icon={Calendar} label="Tanggal Surat"
                value={format(new Date(doc.tanggalSurat), "dd MMMM yyyy", { locale: localeId })} />
              <InfoRow icon={Building} label="Tujuan" value={doc.tujuan ?? "-"} />
              <InfoRow icon={User} label="Pembuat"
                value={`${doc.createdBy.name} (${doc.createdBy.divisi ?? "-"})`} />
            </div>

            {doc.deskripsi && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Keterangan</p>
                <p className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">{doc.deskripsi}</p>
              </div>
            )}
          </div>

          {/* Review note (jika dikembalikan) */}
          {latestReview?.reviewStatus === "DIKEMBALIKAN" && doc.currentStatus === "PERLU_REVISI" && (
            <div className="card p-4 bg-red-50 border-red-200 space-y-2">
              <p className="text-sm font-semibold text-red-800">⚠ Catatan Revisi dari Agendaris</p>
              <p className="text-sm text-red-700">{latestReview.reviewNote ?? "Tidak ada catatan khusus."}</p>
              <p className="text-xs text-red-400">
                {format(new Date(latestReview.reviewedAt), "dd MMM yyyy, HH:mm", { locale: localeId })}
              </p>
            </div>
          )}

          {/* Decision */}
          {latestDecision && (
            <div className="card p-4 bg-purple-50 border-purple-200 space-y-2">
              <p className="text-sm font-semibold text-purple-900">
                Keputusan Direktur: {DECISION_LABELS[latestDecision.decisionType as DecisionType]}
              </p>
              {latestDecision.decisionNote && (
                <p className="text-sm text-purple-700">{latestDecision.decisionNote}</p>
              )}
              <p className="text-xs text-purple-400">
                oleh {latestDecision.director.name} •{" "}
                {format(new Date(latestDecision.decidedAt), "dd MMM yyyy", { locale: localeId })}
              </p>
            </div>
          )}

          {/* Lembar Disposisi — visible to staff only after Direktur issues a DISPOSISI decision */}
          {latestDisposisi && (
            <DisposisiViewer
              disposisi={latestDisposisi}
              doc={{
                nomorSurat:   doc.nomorSurat,
                perihal:      doc.perihal,
                asalSurat:    doc.asalSurat,
                nomorAgenda:  doc.nomorAgenda,
                tanggalSurat: doc.tanggalSurat,
                tanggalTerima: doc.tanggalTerima,
              }}
            />
          )}

          {/* Files */}
          <div className="card p-5 space-y-3">
            <h3 className="font-semibold text-gray-900">File Dokumen</h3>
            {doc.files.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Belum ada file yang diupload.</p>
            ) : (
              <div className="space-y-2">
                {doc.files.map((f) => (
                  <div key={f.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{f.fileName}</p>
                      <p className="text-xs text-gray-400">
                        {f.fileType} · {f.uploadedBy.name} ·{" "}
                        {f.fileSize ? `${(f.fileSize / 1024).toFixed(0)} KB` : ""}
                      </p>
                    </div>
                    <a href={f.filePath} target="_blank" rel="noreferrer"
                       className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            )}

            {/* Upload draft jika masih di awal */}
            {["DRAFT", "PERLU_REVISI"].includes(doc.currentStatus) && (
              <FileUpload documentId={doc.id} fileType="DRAFT" label="Upload File Draft" />
            )}

            {/* Upload scan final */}
            {doc.currentStatus === "MENUNGGU_SCAN_FINAL" && (
              <FileUpload documentId={doc.id} fileType="FINAL_SCAN" label="Upload Scan Final" />
            )}
          </div>

          {/* Action panel */}
          <StaffActionPanel doc={doc} />
        </div>

        {/* Right: timeline */}
        <div className="space-y-5">
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Riwayat Status</h3>
            <StatusTimeline timeline={doc.statusTimeline} />
          </div>

          {/* Archive info */}
          {doc.archive && (
            <div className="card p-5 bg-green-50 border-green-200">
              <p className="font-semibold text-green-900 text-sm mb-1">✅ Dokumen Diarsipkan</p>
              <p className="text-xs text-green-700">
                oleh {doc.archive.archivedBy.name}
              </p>
              <p className="text-xs text-green-600 mt-1">
                {doc.archive.serverLocation}
              </p>
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
