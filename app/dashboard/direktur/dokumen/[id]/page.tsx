// app/dashboard/direktur/dokumen/[id]/page.tsx
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
import { DirectorDecisionPanel } from "@/components/documents/DirectorDecisionPanel";
import { DirectorDisposisiPanel } from "@/components/documents/DirectorDisposisiPanel";
import { DECISION_LABELS } from "@/types";
import { DecisionType } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

export default async function DirektuurDocumentDetail(props: Params) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "DIREKTUR") redirect("/dashboard");

  const doc = await prisma.suratMasuk.findUnique({
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
        take: 1,
      },
      decisions: {
        include: { director: { select: { name: true } } },
        orderBy: { decidedAt: "desc" },
        take: 3,
      },
      statusTimeline: {
        include: { changedBy: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      },
      disposisi: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!doc) notFound();

  // Otomatis ubah status saat dibuka pertama kali oleh Direktur
  if (doc.currentStatus === "MENUNGGU_KEPUTUSAN_DIREKTUR") {
    await prisma.suratMasuk.update({
      where: { id: doc.id },
      data: { currentStatus: "DIPROSES_DIREKTUR" },
    });
    // @ts-ignore - Update instance status so UI reflects the current state
    doc.currentStatus = "DIPROSES_DIREKTUR";
  }

  // Direktur hanya bisa proses dokumen yang menunggu keputusannya
  const canDecide = ["MENUNGGU_KEPUTUSAN_DIREKTUR", "DIPROSES_DIREKTUR"].includes(doc.currentStatus);
  const latestDisposisi = (doc as typeof doc & { disposisi?: { id: string; jabatanKe: string | null; instruksi: string | null; keterangan: string | null; tanggalTandaTangan: Date | null }[] }).disposisi?.[0] ?? null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/direktur" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="page-title">Detail Dokumen</h1>
          <p className="page-subtitle font-mono text-xs">{doc.nomorSurat}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Info card */}
          <div className="card p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-bold text-gray-900">{doc.perihal}</h2>
              <StatusBadge status={doc.currentStatus} />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <InfoRow icon={FileText}  label="Nomor Surat"   value={doc.nomorSurat} mono />
              <InfoRow icon={Calendar} label="Tanggal Surat"
                value={format(new Date(doc.tanggalSurat), "dd MMMM yyyy", { locale: localeId })} />
              <InfoRow icon={Building} label="Tujuan"         value={doc.tujuan ?? "-"} />
              <InfoRow icon={User}     label="Diajukan oleh"
                value={`${doc.createdBy.name} — ${doc.createdBy.divisi ?? "-"}`} />
            </div>
            {doc.deskripsi && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Keterangan</p>
                <p className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg leading-relaxed">
                  {doc.deskripsi}
                </p>
              </div>
            )}
            {/* Catatan Agendaris */}
            {doc.reviews[0]?.reviewNote && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Catatan dari Agendaris</p>
                <p className="text-sm text-gray-700 bg-blue-50 border border-blue-100 px-3 py-2 rounded-lg">
                  {doc.reviews[0].reviewNote}
                </p>
              </div>
            )}
          </div>

          {/* Files */}
          <div className="card p-5 space-y-3">
            <h3 className="font-semibold text-gray-900">Dokumen Terlampir</h3>
            {doc.files.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Tidak ada file terlampir.</p>
            ) : (
              <div className="space-y-2">
                {doc.files.map((f) => (
                  <div key={f.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{f.fileName}</p>
                      <p className="text-xs text-gray-400">{f.fileType} · {f.uploadedBy.name}</p>
                    </div>
                    <a
                      href={f.filePath}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 px-2 py-1 hover:bg-blue-50 rounded"
                    >
                      <Download className="w-3.5 h-3.5" /> Unduh
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lembar Disposisi Panel — Direktur isi Disposisi Kepada + Instruksi */}
          {canDecide && (
            <DirectorDisposisiPanel
              docId={doc.id}
              existingDisposisi={latestDisposisi}
            />
          )}

          {/* Decision panel */}
          {canDecide && <DirectorDecisionPanel doc={doc} />}

          {/* Past decisions (jika sudah ada keputusan sebelumnya) */}
          {doc.decisions.length > 0 && !canDecide && (
            <div className="card p-5 space-y-3">
              <h3 className="font-semibold text-gray-900">Riwayat Keputusan</h3>
              {doc.decisions.map((d) => (
                <div key={d.id} className="p-3 bg-purple-50 border border-purple-200 rounded-lg space-y-1">
                  <p className="text-sm font-semibold text-purple-900">
                    {DECISION_LABELS[d.decisionType as DecisionType]}
                  </p>
                  {d.decisionNote && <p className="text-sm text-purple-700">{d.decisionNote}</p>}
                  <p className="text-xs text-purple-400">
                    {format(new Date(d.decidedAt), "dd MMM yyyy, HH:mm", { locale: localeId })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: timeline */}
        <div className="space-y-5">
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Riwayat Status</h3>
            <StatusTimeline timeline={doc.statusTimeline} />
          </div>
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
