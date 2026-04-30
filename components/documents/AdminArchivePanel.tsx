// components/documents/AdminArchivePanel.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Archive, Loader2, AlertTriangle } from "lucide-react";

interface DocProps { id: string; nomorSurat: string; currentStatus: string; }

export function AdminArchivePanel({
  doc,
  hasScanFile,
}: {
  doc: DocProps;
  hasScanFile: boolean;
}) {
  const router = useRouter();
  const [serverLocation, setServerLocation] = useState(
    `/arsip/${new Date().getFullYear()}/${doc.nomorSurat.replace(/\//g, "-")}`
  );
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  if (doc.currentStatus !== "MENUNGGU_ARSIP_ADMIN") return null;

  const handleArchive = async () => {
    if (!hasScanFile) {
      toast.error("Tidak bisa mengarsipkan: file scan final belum ada.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}/archive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverLocation, notes }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal mengarsipkan.");
      toast.success("Dokumen berhasil diarsipkan secara permanen!");
      router.push("/dashboard/admin/arsip");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-5 space-y-4 border-teal-200">
      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
        <Archive className="w-5 h-5 text-teal-600" />
        Arsipkan Dokumen
      </h3>

      {!hasScanFile && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">
            File scan final belum diupload oleh Staff. Pengarsipan tidak dapat dilakukan.
          </p>
        </div>
      )}

      <div>
        <label className="form-label">Lokasi Penyimpanan Server</label>
        <input
          className="form-input font-mono text-sm"
          value={serverLocation}
          onChange={(e) => setServerLocation(e.target.value)}
          placeholder="/arsip/2025/nomor-surat"
          disabled={loading || !hasScanFile}
        />
        <p className="text-xs text-gray-400 mt-1">
          Path direktori di server/database tempat dokumen akan disimpan permanen.
        </p>
      </div>

      <div>
        <label className="form-label">Catatan Admin (Opsional)</label>
        <textarea
          className="form-input resize-none"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Catatan pengarsipan, nomor boks fisik, rak, dll..."
          disabled={loading || !hasScanFile}
        />
      </div>

      {/* Konfirmasi */}
      <div className={`flex items-start gap-2 p-3 rounded-lg border ${
        confirmed ? "bg-teal-50 border-teal-200" : "bg-gray-50 border-gray-200"
      }`}>
        <input
          type="checkbox"
          id="confirm-archive"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-0.5 accent-teal-600 w-4 h-4"
          disabled={!hasScanFile}
        />
        <label htmlFor="confirm-archive" className="text-sm text-gray-700 cursor-pointer">
          Saya telah memeriksa kesesuaian metadata dan file scan final.
          Pengarsipan ini bersifat <strong>permanen</strong> dan tidak dapat dibatalkan.
        </label>
      </div>

      <button
        onClick={handleArchive}
        disabled={loading || !hasScanFile || !confirmed}
        className="btn-primary w-full justify-center py-2.5 bg-teal-700 hover:bg-teal-800"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Mengarsipkan...</>
        ) : (
          <><Archive className="w-4 h-4" /> Arsipkan Dokumen Secara Permanen</>
        )}
      </button>
    </div>
  );
}
