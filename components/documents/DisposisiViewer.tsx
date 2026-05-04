// components/documents/DisposisiViewer.tsx
// Read-only lembar disposisi for ADMIN_STAFF — displayed after Direktur's DISPOSISI decision.

import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { GitBranch } from "lucide-react";

interface DisposisiData {
  id: string;
  jabatanKe: string | null;
  instruksi: string | null;
  keterangan: string | null;
  tanggalTandaTangan: Date | string | null;
  dari: { name: string };
  ke: { name: string } | null;
  createdAt: Date | string;
}

interface DocMeta {
  nomorSurat: string;
  perihal: string;
  asalSurat: string | null;
  nomorAgenda: string | null;
  tanggalSurat: Date | string;
  tanggalTerima: Date | string;
}

interface DisposisiViewerProps {
  disposisi: DisposisiData;
  doc: DocMeta;
}

const fmtDate = (d?: Date | string | null) =>
  d ? format(new Date(d as string), "dd MMMM yyyy", { locale: localeId }) : "-";

export function DisposisiViewer({ disposisi, doc }: DisposisiViewerProps) {
  return (
    <div className="card p-5 space-y-4">
      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
        <GitBranch className="w-4 h-4 text-blue-600" />
        Lembar Disposisi Surat Masuk
      </h3>

      {/* Formal document layout */}
      <div className="border-2 border-gray-400 rounded-lg overflow-hidden text-sm bg-white">

        {/* Header */}
        <div className="border-b-2 border-gray-400 py-3 px-4 text-center">
          <p className="text-[11px] font-bold text-gray-800 uppercase tracking-wide leading-snug">
            PERUSAHAAN UMUM DAERAH AIR MINUM TIRTA MAKMUR KABUPATEN SUKOHARJO
          </p>
          <p className="text-base font-bold mt-1 tracking-widest text-gray-900">
            LEMBAR DISPOSISI SURAT MASUK
          </p>
        </div>

        {/* Info rows */}
        <div className="divide-y divide-gray-300 border-b-2 border-gray-400">
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-300">
            <InfoRow label="Tanggal Surat" value={fmtDate(doc.tanggalSurat)} />
            <InfoRow label="Tanggal Terima" value={fmtDate(doc.tanggalTerima)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-300">
            <InfoRow label="Asal Surat" value={doc.asalSurat ?? "-"} />
            <InfoRow label="Agenda" value={doc.nomorAgenda ?? "-"} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-300">
            <InfoRow label="Perihal" value={doc.perihal} multiline />
            <InfoRow label="Nomor Surat" value={doc.nomorSurat} mono />
          </div>
        </div>

        {/* Disposisi Kepada + Tanggal Penyelesaian */}
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-300 border-b-2 border-gray-400">
          {/* Left */}
          <div className="p-3">
            <p className="font-bold text-gray-800 mb-2 text-xs uppercase tracking-wide">
              Disposisi Kepada :
            </p>
            <div className="text-xs text-gray-900 px-3 py-2 bg-blue-50 ring-1 ring-blue-400 rounded">
              {disposisi.jabatanKe ? (
                <ul className="list-decimal pl-3 space-y-0.5">
                  {disposisi.jabatanKe.split(",").map((j, i) => (
                    <li key={i}>{j.trim()}</li>
                  ))}
                </ul>
              ) : disposisi.ke?.name ? (
                <p>{disposisi.ke.name}</p>
              ) : (
                <p>-</p>
              )}
            </div>
          </div>

          {/* Right */}
          <div className="p-3 space-y-3">
            <div>
              <p className="font-bold text-gray-800 mb-1.5 text-xs uppercase tracking-wide">
                Tanggal Penyelesaian :
              </p>
              <p className="text-xs text-gray-700">
                {fmtDate(disposisi.tanggalTandaTangan)}
              </p>
            </div>
            {disposisi.keterangan && (
              <div>
                <p className="font-bold text-gray-800 mb-1.5 text-xs uppercase tracking-wide">
                  Catatan :
                </p>
                <p className="text-xs text-gray-700 whitespace-pre-wrap">
                  {disposisi.keterangan}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Instruksi */}
        <div className="p-3">
          <p className="font-bold text-gray-800 mb-1.5 text-xs uppercase tracking-wide">
            Isi Instruksi / Informasi :
          </p>
          <p className="text-xs text-gray-900 whitespace-pre-wrap leading-relaxed">
            {disposisi.instruksi ?? "-"}
          </p>
        </div>

        {/* Footer metadata */}
        <div className="border-t border-gray-200 px-3 py-2 bg-gray-50 flex items-center justify-between text-[10px] text-gray-400">
          <span>Dari: {disposisi.dari.name}</span>
          <span>Dibuat: {fmtDate(disposisi.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  multiline,
  mono,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-1 px-3 py-2">
      <span className="text-xs font-semibold text-gray-600 shrink-0 w-28">{label}</span>
      <span className="text-xs text-gray-500 shrink-0">:</span>
      <span
        className={`text-xs text-gray-900 ml-1 ${mono ? "font-mono" : ""} ${
          multiline ? "whitespace-pre-wrap break-words" : "truncate"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
