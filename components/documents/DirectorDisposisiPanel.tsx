// components/documents/DirectorDisposisiPanel.tsx
// Panel untuk Direktur mengisi Lembar Disposisi (Disposisi Kepada + Instruksi)
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { GitBranch, Loader2, CheckCircle } from "lucide-react";

const JABATAN_OPTIONS = [
  "Kabag Admin dan Keu",
  "Kabag Teknik",
  "Kabag Hublang",
  "Kepala SPI",
  "Kacab. Utara",
  "Kacab. Selatan",
];

interface DirectorDisposisiPanelProps {
  docId: string;
  existingDisposisi?: {
    id: string;
    jabatanKe: string | null;
    instruksi: string | null;
    keterangan: string | null;
    tanggalTandaTangan: Date | string | null;
  } | null;
}

export function DirectorDisposisiPanel({ docId, existingDisposisi }: DirectorDisposisiPanelProps) {
  const router = useRouter();
  const [jabatanKe, setJabatanKe] = useState(existingDisposisi?.jabatanKe ?? "");
  const [instruksi, setInstruksi] = useState(existingDisposisi?.instruksi ?? "");
  const [keterangan, setKeterangan] = useState(existingDisposisi?.keterangan ?? "");
  const [tanggalPenyelesaian, setTanggalPenyelesaian] = useState(
    existingDisposisi?.tanggalTandaTangan
      ? new Date(existingDisposisi.tanggalTandaTangan as string).toISOString().split("T")[0]
      : ""
  );
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const submit = async () => {
    if (!jabatanKe) {
      toast.error("Pilih penerima disposisi.");
      return;
    }
    if (!instruksi.trim()) {
      toast.error("Isi instruksi/informasi wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${docId}/disposisi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jabatanKe,
          instruksi,
          keterangan: keterangan || undefined,
          tanggalPenyelesaian: tanggalPenyelesaian || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal menyimpan disposisi.");
      toast.success(json.message ?? "Lembar disposisi berhasil disimpan!");
      setSaved(true);
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-5 space-y-4">
      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
        <GitBranch className="w-4 h-4 text-blue-600" />
        Isi Lembar Disposisi
        {saved && (
          <span className="ml-auto flex items-center gap-1 text-xs text-green-600 font-normal">
            <CheckCircle className="w-3.5 h-3.5" /> Tersimpan
          </span>
        )}
      </h3>

      {/* Disposisi Kepada */}
      <div>
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
          Disposisi Kepada <span className="text-red-500">*</span>
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {JABATAN_OPTIONS.map((jabatan) => (
            <label
              key={jabatan}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer text-xs transition-colors ${
                jabatanKe === jabatan
                  ? "border-blue-500 bg-blue-50 text-blue-900 font-medium ring-1 ring-blue-400"
                  : "border-gray-200 hover:border-gray-300 text-gray-700"
              }`}
            >
              <input
                type="radio"
                name="jabatan-ke"
                value={jabatan}
                checked={jabatanKe === jabatan}
                onChange={() => setJabatanKe(jabatan)}
                className="accent-blue-600 shrink-0"
              />
              {jabatan}
            </label>
          ))}
        </div>
      </div>

      {/* Isi Instruksi / Informasi */}
      <div>
        <label className="form-label">
          Isi Instruksi / Informasi <span className="text-red-500">*</span>
        </label>
        <textarea
          className="form-input resize-none"
          rows={4}
          placeholder="Tuliskan instruksi yang harus dilaksanakan..."
          value={instruksi}
          onChange={(e) => setInstruksi(e.target.value)}
          disabled={loading}
        />
      </div>

      {/* Tanggal Penyelesaian + Catatan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="form-label">Tanggal Penyelesaian</label>
          <input
            type="date"
            className="form-input"
            value={tanggalPenyelesaian}
            onChange={(e) => setTanggalPenyelesaian(e.target.value)}
            disabled={loading}
          />
        </div>
        <div>
          <label className="form-label">Catatan</label>
          <textarea
            className="form-input resize-none"
            rows={2}
            placeholder="Catatan tambahan (opsional)..."
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      <button
        onClick={submit}
        disabled={loading}
        className="btn-primary w-full justify-center py-2.5"
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan Disposisi...</>
          : <><GitBranch className="w-4 h-4" /> Simpan Lembar Disposisi</>
        }
      </button>
    </div>
  );
}
