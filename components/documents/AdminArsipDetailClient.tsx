// components/documents/AdminArsipDetailClient.tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { ArrowLeft, FileText, Download, Calendar, User, Printer, Eye } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatusTimeline } from "@/components/documents/StatusTimeline";
import { AdminArchivePanel } from "@/components/documents/AdminArchivePanel";
import { AgendarisActionPanel } from "@/components/documents/AgendarisActionPanel";
import { DocumentPreview } from "@/components/documents/DocumentPreview";
import { DECISION_LABELS } from "@/types";
import { DecisionType } from "@prisma/client";

export default function AdminArsipDetailClient({ doc, staffUsers }: { doc: any; staffUsers: any }) {
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string } | null>(null);

  const latestDecision = doc.decisions[0];
  const latestDisposisi = doc.disposisi?.[0] ?? null;
  const draftFiles = doc.files.filter((f: any) => f.fileType === "DRAFT");
  const scanFiles = doc.files.filter((f: any) => f.fileType === "FINAL_SCAN");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/admin/arsip" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="page-title">Detail & Pengarsipan Dokumen</h1>
          <p className="page-subtitle font-mono text-xs">{doc.nomorSurat}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left */}
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
              <InfoRow icon={User} label="Pembuat"
                value={`${doc.createdBy.name} (${doc.createdBy.divisi ?? "-"})`} />
              <InfoRow icon={User} label="Email" value={doc.createdBy.email} />
            </div>

            {doc.deskripsi && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Keterangan</p>
                <p className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">{doc.deskripsi}</p>
              </div>
            )}
          </div>

          {/* Keputusan Direktur */}
          {latestDecision && (
            <div className="card p-4 bg-purple-50 border-purple-200 space-y-2">
              <p className="text-sm font-semibold text-purple-900">
                Keputusan Direktur: {DECISION_LABELS[latestDecision.decisionType as DecisionType]}
              </p>
              {latestDecision.decisionNote && (
                <p className="text-sm text-purple-700">{latestDecision.decisionNote}</p>
              )}
              <p className="text-xs text-purple-400">
                {latestDecision.director.name} ·{" "}
                {format(new Date(latestDecision.decidedAt), "dd MMM yyyy, HH:mm", { locale: localeId })}
              </p>
            </div>
          )}

          {/* Files - Draft */}
          {draftFiles.length > 0 && (
            <div className="card p-5 space-y-3">
              <h3 className="font-semibold text-gray-900">File Draft</h3>
              <div className="space-y-2">
                {draftFiles.map((f: any) => (
                  <FileRow key={f.id} file={f} onPreview={(url, name) => setPreviewFile({ url, name })} />
                ))}
              </div>
            </div>
          )}

          {/* Files - Scan Final */}
          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">File Scan Final</h3>
              {scanFiles.length > 0 && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                  {scanFiles.length} file tersedia
                </span>
              )}
            </div>
            {scanFiles.length === 0 ? (
              <p className="text-sm text-red-500 font-medium">Belum ada file scan final. Pastikan Staff sudah mengupload scan.
              </p>
            ) : (
              <div className="space-y-2">
                {scanFiles.map((f: any) => (
                  <FileRow key={f.id} file={f} highlight onPreview={(url, name) => setPreviewFile({ url, name })} />
                ))}
              </div>
            )}
          </div>

          {/* Lembar Disposisi (tampil setelah Direktur memberikan keputusan) */}
          {doc.currentStatus === "KEPUTUSAN_DIREKTUR_SELESAI" && (
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Lembar Disposisi</h3>
                <Link
                  href={`/dashboard/admin/arsip/${doc.id}/cetak-disposisi`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" /> Cetak Lembar Disposisi
                </Link>
                <a
                  href={`/api/documents/${doc.id}/print-combined`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-sm shadow-emerald-200"
                >
                  <Printer className="w-3.5 h-3.5" /> Cetak Gabungan (Surat + Disposisi)
                </a>
              </div>

              <div className="border-2 border-gray-400 rounded-lg overflow-hidden text-sm bg-white">
                {/* Header */}
                <div className="border-b-2 border-gray-400 py-3 px-4 text-center">
                  <p className="text-[11px] font-bold text-gray-800 uppercase tracking-wide leading-snug">
                    PERUSAHAAN UMUM DAERAH AIR MINUM TIRTA MAKMUR KABUPATEN SUKOHARJO
                  </p>
                  <p className="text-base font-bold mt-1 tracking-widest text-gray-900">LEMBAR DISPOSISI</p>
                </div>

                {/* Info rows */}
                <div className="divide-y divide-gray-300 border-b-2 border-gray-400 text-xs">
                  <div className="grid grid-cols-2 divide-x divide-gray-300">
                    <DisposisiRow label="Tanggal Surat" value={format(new Date(doc.tanggalSurat), "dd MMMM yyyy", { locale: localeId })} />
                    <DisposisiRow label="Tanggal Terima" value={format(new Date(doc.tanggalTerima), "dd MMMM yyyy", { locale: localeId })} />
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-gray-300">
                    <DisposisiRow label="Asal Surat" value={doc.asalSurat ?? "-"} />
                    <DisposisiRow label="No. Agenda" value={doc.nomorAgenda ?? "-"} />
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-gray-300">
                    <DisposisiRow label="Perihal" value={doc.perihal} />
                    <DisposisiRow label="Nomor Surat" value={doc.nomorSurat} mono />
                  </div>
                </div>

                {/* Disposisi Kepada + Tanggal Penyelesaian */}
                <div className="grid grid-cols-2 divide-x divide-gray-300 border-b-2 border-gray-400 text-xs">
                  <div className="p-3">
                    <p className="font-bold text-gray-700 uppercase tracking-wide mb-2">Disposisi Kepada :</p>
                    <div className="text-gray-900 font-semibold text-sm">
                      {latestDisposisi?.jabatanKe ? (
                        <ul className="list-decimal pl-4 space-y-0.5">
                          {latestDisposisi.jabatanKe.split(",").map((j: string, i: number) => (
                            <li key={i}>{j.trim()}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>-</p>
                      )}
                    </div>
                  </div>
                  <div className="p-3 space-y-2">
                    <div>
                      <p className="font-bold text-gray-700 uppercase tracking-wide mb-1">Tanggal Penyelesaian :</p>
                      <p className="text-blue-700 font-medium">
                        {latestDisposisi?.tanggalTandaTangan
                          ? format(new Date(latestDisposisi.tanggalTandaTangan), "dd MMMM yyyy", { locale: localeId })
                          : "-"}
                      </p>
                    </div>
                    {latestDisposisi?.keterangan && (
                      <div>
                        <p className="font-bold text-gray-700 uppercase tracking-wide mb-1">Catatan :</p>
                        <p className="text-blue-700 font-medium whitespace-pre-wrap">{latestDisposisi?.keterangan}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Instruksi */}
                <div className="p-3 text-xs">
                  <p className="font-bold text-gray-700 uppercase tracking-wide mb-1.5">Isi Instruksi / Informasi :</p>
                  <p className="text-blue-700 font-medium whitespace-pre-wrap leading-relaxed">{latestDisposisi?.instruksi ?? "-"}</p>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 px-3 py-2 bg-gray-50 flex justify-between text-[10px] text-gray-400">
                  <span>Dari: {latestDisposisi?.dari?.name ?? "-"}</span>
                  <span>Status: Dikembalikan ke Agendaris</span>
                </div>
              </div>
            </div>
          )}

          {/* Review action */}
          <AgendarisActionPanel
            doc={doc}
            staffUsers={staffUsers}
            existingDisposisi={latestDisposisi ? { jabatanKe: latestDisposisi.jabatanKe, instruksi: latestDisposisi.instruksi, keterangan: latestDisposisi.keterangan } : null}
          />

          {/* Archive action */}
          {!doc.archive ? (
            <AdminArchivePanel doc={doc} hasScanFile={scanFiles.length > 0} />
          ) : (
            <div className="card p-5 bg-green-50 border-green-200 space-y-3">
              <h3 className="font-semibold text-green-900 flex items-center gap-2">
                ✅ Dokumen Sudah Diarsipkan
              </h3>
              <div className="text-sm text-green-800 space-y-1">
                <p><span className="font-medium">Diarsipkan oleh:</span> {doc.archive.archivedBy.name}</p>
                <p><span className="font-medium">Tanggal:</span>{" "}
                  {format(new Date(doc.archive.archivedAt), "dd MMMM yyyy, HH:mm", { locale: localeId })}</p>
                <p><span className="font-medium">Lokasi:</span>{" "}
                  <code className="bg-green-100 px-1.5 rounded text-xs">{doc.archive.serverLocation}</code></p>
                {doc.archive.notes && <p><span className="font-medium">Catatan:</span> {doc.archive.notes}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Right */}
        <div className="space-y-5">
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Riwayat Status</h3>
            <StatusTimeline timeline={doc.statusTimeline} />
          </div>
        </div>
      </div>

      <DocumentPreview 
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        fileUrl={previewFile?.url || ""}
        fileName={previewFile?.name || ""}
      />
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
      <p className={`text-sm text-gray-900 break-all ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

function FileRow({ file, highlight, onPreview }: {
  file: { id: string; fileName: string; filePath: string; fileType: string; mimeType: string | null; fileSize: number | null; uploadedBy: { name: string }; uploadedAt: Date | string };
  highlight?: boolean;
  onPreview: (url: string, name: string) => void;
}) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${highlight ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
      <FileText className={`w-5 h-5 shrink-0 ${highlight ? "text-green-600" : "text-blue-500"}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.fileName}</p>
        <p className="text-xs text-gray-400">
          {file.fileType} · {file.uploadedBy.name}
          {file.fileSize ? ` · ${(file.fileSize / 1024).toFixed(0)} KB` : ""}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <button 
          onClick={() => onPreview(file.filePath, file.fileName)}
          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
          title="Preview"
        >
          <Eye className="w-4 h-4" />
        </button>
        <a href={file.filePath} target="_blank" rel="noreferrer"
          className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
          title="Unduh"
        >
          <Download className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

function DisposisiRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-1 px-3 py-2">
      <span className="text-xs font-semibold text-gray-600 shrink-0 w-28">{label}</span>
      <span className="text-xs text-gray-500 shrink-0">:</span>
      <span className={`text-xs text-gray-900 ml-1 ${mono ? "font-mono" : ""} truncate`}>{value}</span>
    </div>
  );
}
