/**
 * @file app/dashboard/kabag/dokumen/[id]/page.tsx
 * @description Detail dokumen untuk role KABAG. Menampilkan instruksi disposisi dari Direktur Utama.
 */
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { ArrowLeft, FileText, Download, Calendar, User, Building, AlertCircle } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatusTimeline } from "@/components/documents/StatusTimeline";
import { DisposisiViewer } from "@/components/documents/DisposisiViewer";

type Params = { params: Promise<{ id: string }> };

export default async function KabagDocumentDetail(props: Params) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "KABAG" && session.user.role !== "KASUBAG")) redirect("/dashboard");

  const doc = await prisma.suratMasuk.findUnique({
    where: { id: params.id },
    include: {
      createdBy: { select: { name: true, divisi: true } },
      files: {
        include: { uploadedBy: { select: { name: true } } },
        orderBy: { uploadedAt: "desc" },
      },
      statusTimeline: {
        include: { changedBy: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      },
      disposisi: {
        include: {
          dari: { select: { name: true } },
          ke:   { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!doc) notFound();

  const latestDisposisi = doc.disposisi[0] ?? null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/kabag/disposisi" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="page-title">Detail Disposisi</h1>
          <p className="page-subtitle font-mono text-xs">{doc.nomorSurat}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          
          {/* Instruksi Highlight */}
          {latestDisposisi && (
            <div className="card p-5 bg-blue-50 border-blue-200 border-l-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-blue-900">Instruksi Direktur Utama</h3>
              </div>
              <p className="text-lg text-blue-800 italic leading-relaxed font-serif">
                "{latestDisposisi.instruksi || "Silakan lakukan tindak lanjut sesuai prosedur yang berlaku."}"
              </p>
              <div className="mt-4 pt-4 border-t border-blue-100 flex items-center justify-between text-xs text-blue-600">
                <span>Diteruskan oleh: {latestDisposisi.dari.name}</span>
                <span>{format(new Date(latestDisposisi.createdAt), "dd MMM yyyy, HH:mm", { locale: localeId })}</span>
              </div>
            </div>
          )}

          {/* Info Utama */}
          <div className="card p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-bold text-gray-900">{doc.perihal}</h2>
              <StatusBadge status={doc.currentStatus} />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <InfoRow icon={FileText}  label="Nomor Surat"   value={doc.nomorSurat} mono />
              <InfoRow icon={Calendar} label="Tanggal Surat"
                value={format(new Date(doc.tanggalSurat), "dd MMMM yyyy", { locale: localeId })} />
              <InfoRow icon={Building} label="Asal Surat"     value={doc.asalSurat ?? "-"} />
              <InfoRow icon={User}     label="Dibuat Oleh"
                value={`${doc.createdBy.name} (${doc.createdBy.divisi ?? "-"})`} />
            </div>
          </div>

          {/* Lembar Disposisi Digital */}
          {latestDisposisi && (
            <DisposisiViewer 
              disposisi={latestDisposisi} 
              doc={{
                nomorSurat: doc.nomorSurat,
                perihal: doc.perihal,
                asalSurat: doc.asalSurat,
                nomorAgenda: doc.nomorAgenda,
                tanggalSurat: doc.tanggalSurat,
                tanggalTerima: doc.tanggalTerima
              }}
            />
          )}

          {/* File Lampiran */}
          <div className="card p-5 space-y-3">
            <h3 className="font-semibold text-gray-900">File Lampiran</h3>
            {doc.files.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Tidak ada file lampiran.</p>
            ) : (
              <div className="space-y-2">
                {doc.files.map((f) => (
                  <div key={f.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 group">
                    <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{f.fileName}</p>
                      <p className="text-[10px] text-gray-400 uppercase">{f.fileType}</p>
                    </div>
                    <a
                      href={f.filePath}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Timeline */}
        <div className="space-y-5">
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Riwayat Alur</h3>
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
