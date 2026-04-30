// components/documents/StaffActionPanel.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Send, CheckCircle, Loader2 } from "lucide-react";

interface DocProps {
  id: string;
  currentStatus: string;
}

export function StaffActionPanel({ doc }: { doc: DocProps }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const doAction = async (url: string, method: string, successMsg: string) => {
    setLoading(true);
    try {
      const res = await fetch(url, { method });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal.");
      toast.success(successMsg);
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  if (doc.currentStatus === "DRAFT" || doc.currentStatus === "PERLU_REVISI") {
    return (
      <div className="card p-5 bg-blue-50 border-blue-200">
        <p className="text-sm text-blue-800 font-medium mb-3">
          {doc.currentStatus === "PERLU_REVISI"
            ? "Perbaiki dokumen, lalu kirim ulang ke Admin."
            : "Dokumen siap dikirim ke Admin untuk divalidasi."}
        </p>
        <button
          onClick={() => doAction(`/api/documents/${doc.id}/submit`, "POST",
            "Dokumen berhasil dikirim ke Admin!")}
          disabled={loading}
          className="btn-primary w-full justify-center"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Mengirim...</>
            : <><Send className="w-4 h-4" /> Kirim ke Admin</>}
        </button>
      </div>
    );
  }

  if (doc.currentStatus === "MENUNGGU_PENGAMBILAN_STAFF") {
    return (
      <div className="card p-5 bg-orange-50 border-orange-200">
        <p className="text-sm text-orange-800 font-medium mb-1">
          Surat fisik siap diambil di ruang Sekretariat / Admin.
        </p>
        <p className="text-xs text-orange-600 mb-3">
          Konfirmasi setelah Anda mengambil surat fisik, lalu lakukan scan dokumen.
        </p>
        <button
          onClick={() => doAction(`/api/documents/${doc.id}/notify-pickup`, "PUT",
            "Pengambilan dikonfirmasi. Silakan upload scan final.")}
          disabled={loading}
          className="btn-primary w-full justify-center bg-orange-600 hover:bg-orange-700"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
            : <><CheckCircle className="w-4 h-4" /> Konfirmasi Sudah Diambil</>}
        </button>
      </div>
    );
  }

  return null;
}
