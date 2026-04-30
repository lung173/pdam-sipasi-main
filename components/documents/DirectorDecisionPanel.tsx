// components/documents/DirectorDecisionPanel.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { CheckCircle, XCircle, RotateCcw, GitBranch, Loader2 } from "lucide-react";
import { DecisionType } from "@prisma/client";
import { DECISION_LABELS } from "@/types";

interface DocProps { id: string; currentStatus: string; }

const DECISION_OPTIONS: { type: DecisionType; label: string; icon: React.ElementType; cls: string }[] = [
  { type: "DISETUJUI",  label: "Setujui",    icon: CheckCircle, cls: "btn-success" },
  { type: "DITOLAK",    label: "Tolak",       icon: XCircle,     cls: "btn-danger" },
  { type: "REVISI",     label: "Minta Revisi",icon: RotateCcw,   cls: "bg-yellow-600 hover:bg-yellow-700 text-white inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50 transition-colors" },
  { type: "DISPOSISI",  label: "Disposisi",   icon: GitBranch,   cls: "btn-secondary" },
];

export function DirectorDecisionPanel({ doc }: { doc: DocProps }) {
  const router = useRouter();
  const [selected, setSelected] = useState<DecisionType | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const [autoSign, setAutoSign] = useState(false);

  if (!["MENUNGGU_KEPUTUSAN_DIREKTUR", "DIPROSES_DIREKTUR"].includes(doc.currentStatus)) {
    return null;
  }

  const submit = async () => {
    if (!selected) { toast.error("Pilih jenis keputusan terlebih dahulu."); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decisionType: selected, decisionNote: note, autoSign }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal menyimpan keputusan.");
      toast.success(json.message ?? "Keputusan berhasil disimpan!");
      router.push("/dashboard/direktur");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-5 space-y-4">
      <h3 className="font-semibold text-gray-900">Berikan Keputusan</h3>

      {/* Decision type selection */}
      <div className="grid grid-cols-2 gap-3">
        {DECISION_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isSelected = selected === opt.type;
          return (
            <button
              key={opt.type}
              onClick={() => {
                setSelected(opt.type);
                if (opt.type !== "DISETUJUI") setAutoSign(false);
              }}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all
                ${isSelected
                  ? "border-blue-500 bg-blue-50 text-blue-900"
                  : "border-gray-200 hover:border-gray-300 text-gray-700"
                }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Selected indicator & Auto Sign Checkbox */}
      {selected && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-3">
          <p className="text-sm font-medium text-blue-900">
            Keputusan dipilih: <span className="text-blue-700">{DECISION_LABELS[selected]}</span>
          </p>
          
          {selected === "DISETUJUI" && (
            <label className="flex items-start gap-2 pt-2 border-t border-blue-100 cursor-pointer">
              <input 
                type="checkbox" 
                className="mt-1"
                checked={autoSign}
                onChange={(e) => setAutoSign(e.target.checked)}
                disabled={loading}
              />
              <span className="text-sm text-blue-900">
                <strong className="block">Bubuhkan Tanda Tangan Barcode (Otomatis)</strong>
                <span className="text-xs text-blue-700">Sistem akan menanamkan QR Code persetujuan di dokumen PDF, sehingga Staff tidak perlu print ulang.</span>
              </span>
            </label>
          )}
        </div>
      )}

      {/* Note */}
      <div>
        <label className="form-label">
          Catatan / Disposisi{" "}
          <span className="text-gray-400 font-normal">(opsional)</span>
        </label>
        <textarea
          className="form-input resize-none"
          rows={4}
          placeholder="Tuliskan catatan, instruksi, atau disposisi untuk Sekretariat/Admin dan Staff..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={loading}
        />
      </div>

      <button
        onClick={submit}
        disabled={loading || !selected}
        className="btn-primary w-full justify-center py-2.5"
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan Keputusan...</>
          : "Simpan & Kembalikan ke Admin"}
      </button>
    </div>
  );
}
