// components/documents/AgendarisActionPanel.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Send, RotateCcw, Bell, Loader2, GitBranch, Clock } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface StaffUser { id: string; name: string; divisi: string | null }
interface DocProps {
  id: string;
  currentStatus: string;
  nomorSurat?: string;
  perihal?: string;
  tanggalSurat?: Date | string;
  tanggalTerima?: Date | string;
  asalSurat?: string | null;
  nomorAgenda?: string | null;
}

type Mode = "idle" | "teruskan" | "kembalikan" | "disposisi";
type WaktuKirim = "LANGSUNG" | "BESOK_PAGI" | "BESOK_SIANG" | "LUSA_PAGI" | "LUSA_SIANG";

const WAKTU_OPTIONS: { value: WaktuKirim; label: string }[] = [
  { value: "LANGSUNG",    label: "Langsung sekarang" },
  { value: "BESOK_PAGI",  label: "Besok pagi (07:00)" },
  { value: "BESOK_SIANG", label: "Besok siang (09:00)" },
  { value: "LUSA_PAGI",   label: "Lusa pagi (07:00)" },
  { value: "LUSA_SIANG",  label: "Lusa siang (09:00)" },
];

export function AgendarisActionPanel({
  doc,
  staffUsers = [],
}: {
  doc: DocProps;
  staffUsers?: StaffUser[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("idle");

  // Teruskan state
  const [reviewNote, setReviewNote] = useState("");
  const [waktu, setWaktu] = useState<WaktuKirim>("LANGSUNG");
  const [isUrgen, setIsUrgen] = useState(false);

  // Kembalikan state
  const [revisiNote, setRevisiNote] = useState("");

  // Disposisi state
  const [keId, setKeId] = useState("");
  const [instruksi, setInstruksi] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [tanggalPenyelesaian, setTanggalPenyelesaian] = useState("");

  // Editable document fields (Agendaris dapat mengoreksi saat buat disposisi)
  const toDateInput = (d?: Date | string) =>
    d ? new Date(d as string).toISOString().split("T")[0] : "";
  const [editNomorSurat, setEditNomorSurat] = useState(doc.nomorSurat ?? "");
  const [editPerihal, setEditPerihal] = useState(doc.perihal ?? "");
  const [editTanggalTerima, setEditTanggalTerima] = useState(toDateInput(doc.tanggalTerima));
  const [editAsalSurat, setEditAsalSurat] = useState(doc.asalSurat ?? "");
  const [editNomorAgenda, setEditNomorAgenda] = useState(doc.nomorAgenda ?? "");

  const reset = () => {
    setMode("idle");
    setReviewNote(""); setRevisiNote("");
    setKeId(""); setInstruksi(""); setKeterangan(""); setTanggalPenyelesaian("");
    setWaktu("LANGSUNG"); setIsUrgen(false);
    setEditNomorSurat(doc.nomorSurat ?? "");
    setEditPerihal(doc.perihal ?? "");
    setEditTanggalTerima(toDateInput(doc.tanggalTerima));
    setEditAsalSurat(doc.asalSurat ?? "");
    setEditNomorAgenda(doc.nomorAgenda ?? "");
  };

  const submitTeruskan = async () => {
    setLoading(true);
    try {
      const endpoint = `/api/documents/${doc.id}/jadwal`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ waktu, isUrgen, catatan: reviewNote || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal.");
      toast.success(json.message ?? "Berhasil!");
      router.push("/dashboard/admin/inbox");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally { setLoading(false); }
  };

  const submitKembalikan = async () => {
    if (!revisiNote.trim()) {
      toast.error("Harap isi catatan revisi untuk Staff.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewStatus: "DIKEMBALIKAN", reviewNote: revisiNote }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal.");
      toast.success(json.message ?? "Dokumen dikembalikan ke Staff.");
      router.push("/dashboard/admin/inbox");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally { setLoading(false); }
  };

  const submitDisposisi = async () => {
    if (!keId) { toast.error("Pilih penerima disposisi."); return; }
    if (!instruksi.trim()) { toast.error("Instruksi disposisi wajib diisi."); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}/disposisi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keId, instruksi, keterangan,
          tanggalPenyelesaian: tanggalPenyelesaian || undefined,
          // Document field corrections
          nomorSurat: editNomorSurat || undefined,
          perihal: editPerihal || undefined,
          asalSurat: editAsalSurat || undefined,
          nomorAgenda: editNomorAgenda || undefined,
          tanggalTerima: editTanggalTerima || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal.");
      toast.success(json.message ?? "Disposisi berhasil dibuat!");
      router.push("/dashboard/admin/inbox");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally { setLoading(false); }
  };

  const fmtDate = (d?: Date | string) =>
    d ? format(new Date(d as string), "dd MMMM yyyy", { locale: localeId }) : "-";

  // ─── MENUNGGU REVIEW ────────────────────────────────────────
  if (doc.currentStatus === "MENUNGGU_REVIEW_AGENDARIS") {
    return (
      <div className="card p-5 space-y-4">
        <h3 className="font-semibold text-gray-900">Tindakan Review</h3>

        {mode === "idle" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button onClick={() => setMode("teruskan")} className="btn-success justify-center">
              <Send className="w-4 h-4" /> Teruskan ke Direktur
            </button>
            <button onClick={() => setMode("kembalikan")} className="btn-danger justify-center">
              <RotateCcw className="w-4 h-4" /> Kembalikan ke Staff
            </button>
            <button onClick={() => setMode("disposisi")} className="btn-secondary justify-center">
              <GitBranch className="w-4 h-4" /> Buat Disposisi
            </button>
          </div>
        )}

        {/* ─── Teruskan ke Direktur ─── */}
        {mode === "teruskan" && (
          <div className="space-y-4">
            <div>
              <label className="form-label flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-500" /> Jadwal Pengiriman
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {WAKTU_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer text-sm transition-colors ${
                      waktu === opt.value
                        ? "border-blue-500 bg-blue-50 text-blue-900 font-medium"
                        : "border-gray-200 hover:border-gray-300 text-gray-700"
                    }`}
                  >
                    <input
                      type="radio"
                      className="accent-blue-600"
                      name="waktu"
                      value={opt.value}
                      checked={waktu === opt.value}
                      onChange={() => setWaktu(opt.value)}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
              <input
                type="checkbox"
                className="accent-red-600"
                checked={isUrgen}
                onChange={(e) => setIsUrgen(e.target.checked)}
              />
              <span className="font-medium text-red-700">Tandai sebagai URGEN</span>
            </label>

            <textarea
              className="form-input resize-none"
              rows={3}
              placeholder="Catatan untuk Direktur (opsional)..."
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
            />
            <div className="flex gap-2">
              <button onClick={reset} className="btn-secondary flex-1 justify-center">Batal</button>
              <button
                onClick={submitTeruskan}
                disabled={loading}
                className="btn-success flex-1 justify-center"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" />...</>
                  : <><Send className="w-4 h-4" /> {waktu === "LANGSUNG" ? "Teruskan Sekarang" : "Simpan Jadwal"}</>
                }
              </button>
            </div>
          </div>
        )}

        {/* ─── Kembalikan ke Staff ─── */}
        {mode === "kembalikan" && (
          <div className="space-y-3">
            <p className="text-sm text-red-700 font-medium">
              Dokumen akan dikembalikan ke Staff untuk diperbaiki.
            </p>
            <textarea
              className="form-input resize-none border-red-300 focus:ring-red-400"
              rows={4}
              placeholder="Tuliskan catatan revisi yang jelas untuk Staff... (wajib)"
              value={revisiNote}
              onChange={(e) => setRevisiNote(e.target.value)}
            />
            <div className="flex gap-2">
              <button onClick={reset} className="btn-secondary flex-1 justify-center">Batal</button>
              <button
                onClick={submitKembalikan}
                disabled={loading}
                className="btn-danger flex-1 justify-center"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" />...</>
                  : <><RotateCcw className="w-4 h-4" /> Kembalikan ke Staff</>
                }
              </button>
            </div>
          </div>
        )}

        {/* ─── Lembar Disposisi ─── */}
        {mode === "disposisi" && (
          <div className="space-y-4">
            {/* Formal Lembar Disposisi form */}
            <div className="border-2 border-gray-400 rounded-lg overflow-hidden text-sm bg-white">

              {/* Header */}
              <div className="border-b-2 border-gray-400 py-3 px-4 text-center">
                <p className="text-[11px] font-bold text-gray-800 uppercase tracking-wide leading-snug">
                  PERUSAHAAN UMUM DAERAH AIR MINUM TIRTA MAKMUR KABUPATEN SUKOHARJO
                </p>
                <p className="text-base font-bold mt-1 tracking-widest text-gray-900">
                  LEMBAR DISPOSISI
                </p>
              </div>

              {/* Info rows: Tanggal Surat (static) + editable fields */}
              <div className="divide-y divide-gray-300 border-b-2 border-gray-400">
                {/* Row 1: Tanggal Surat (read-only) | Tanggal Terima (editable) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-300">
                  <FormInfoRow label="Tanggal Surat" value={fmtDate(doc.tanggalSurat)} />
                  <FormEditRow label="Tanggal Terima">
                    <input
                      type="date"
                      className="form-input text-xs py-1"
                      value={editTanggalTerima}
                      onChange={(e) => setEditTanggalTerima(e.target.value)}
                    />
                  </FormEditRow>
                </div>
                {/* Row 2: Asal Surat | Agenda */}
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-300">
                  <FormEditRow label="Asal Surat">
                    <input
                      className="form-input text-xs py-1"
                      placeholder="Asal surat..."
                      value={editAsalSurat}
                      onChange={(e) => setEditAsalSurat(e.target.value)}
                    />
                  </FormEditRow>
                  <FormEditRow label="Agenda">
                    <input
                      className="form-input text-xs py-1 font-mono"
                      placeholder="No. agenda..."
                      value={editNomorAgenda}
                      onChange={(e) => setEditNomorAgenda(e.target.value)}
                    />
                  </FormEditRow>
                </div>
                {/* Row 3: Perihal | Nomor Surat */}
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-300">
                  <FormEditRow label="Perihal">
                    <textarea
                      className="form-input text-xs py-1 resize-none"
                      rows={2}
                      placeholder="Perihal surat..."
                      value={editPerihal}
                      onChange={(e) => setEditPerihal(e.target.value)}
                    />
                  </FormEditRow>
                  <FormEditRow label="Nomor Surat">
                    <input
                      className="form-input text-xs py-1 font-mono"
                      placeholder="Nomor surat..."
                      value={editNomorSurat}
                      onChange={(e) => setEditNomorSurat(e.target.value)}
                    />
                  </FormEditRow>
                </div>
              </div>

              {/* Disposisi Kepada + Tanggal Penyelesaian & Catatan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-300 border-b-2 border-gray-400">
                {/* Left: Disposisi Kepada */}
                <div className="p-3">
                  <p className="font-bold text-gray-800 mb-2 text-xs uppercase tracking-wide">
                    Disposisi Kepada :
                  </p>
                  {staffUsers.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">Tidak ada penerima tersedia.</p>
                  ) : (
                    <div className="space-y-1">
                      {staffUsers.map((u, i) => (
                        <label
                          key={u.id}
                          className={`flex items-start gap-2.5 px-2 py-1.5 rounded cursor-pointer transition-colors ${
                            keId === u.id
                              ? "bg-blue-50 ring-1 ring-blue-400"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="disposisi-ke"
                            value={u.id}
                            checked={keId === u.id}
                            onChange={() => setKeId(u.id)}
                            className="accent-blue-600 mt-0.5 shrink-0"
                          />
                          <span className="text-xs text-gray-800">
                            {i + 1}.&nbsp;{u.name}
                            {u.divisi && (
                              <span className="text-gray-400 ml-1">({u.divisi})</span>
                            )}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Tanggal Penyelesaian + Catatan */}
                <div className="p-3 space-y-3">
                  <div>
                    <p className="font-bold text-gray-800 mb-1.5 text-xs uppercase tracking-wide">
                      Tanggal Penyelesaian :
                    </p>
                    <input
                      type="date"
                      className="form-input text-xs"
                      value={tanggalPenyelesaian}
                      onChange={(e) => setTanggalPenyelesaian(e.target.value)}
                    />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 mb-1.5 text-xs uppercase tracking-wide">
                      Catatan :
                    </p>
                    <textarea
                      className="form-input resize-none text-xs"
                      rows={4}
                      placeholder="Catatan tambahan..."
                      value={keterangan}
                      onChange={(e) => setKeterangan(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Instruksi / Informasi */}
              <div className="p-3">
                <p className="font-bold text-gray-800 mb-1.5 text-xs uppercase tracking-wide">
                  Isi Instruksi / Informasi <span className="text-red-500">*</span> :
                </p>
                <textarea
                  className="form-input resize-none"
                  rows={3}
                  placeholder="Tuliskan instruksi yang harus dilaksanakan..."
                  value={instruksi}
                  onChange={(e) => setInstruksi(e.target.value)}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button onClick={reset} className="btn-secondary flex-1 justify-center">Batal</button>
              <button
                onClick={submitDisposisi}
                disabled={loading}
                className="btn-primary flex-1 justify-center"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                  : <><GitBranch className="w-4 h-4" /> Buat &amp; Teruskan ke Direktur</>
                }
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── SETELAH KEPUTUSAN DIREKTUR ──────────────────────────────
  if (doc.currentStatus === "KEPUTUSAN_DIREKTUR_SELESAI") {
    return (
      <div className="card p-5 bg-orange-50 border-orange-200 space-y-3">
        <h3 className="font-semibold text-orange-900">Hubungi Staff</h3>
        <p className="text-sm text-orange-700">
          Direktur telah memberikan keputusan. Beritahu Staff untuk mengambil surat fisik.
        </p>
        <button
          onClick={async () => {
            setLoading(true);
            try {
              const res = await fetch(`/api/documents/${doc.id}/notify-pickup`, { method: "POST" });
              const json = await res.json();
              if (!res.ok) throw new Error(json.error ?? "Gagal.");
              toast.success("Notifikasi pengambilan berhasil dikirim ke Staff!");
              router.refresh();
            } catch (err: unknown) {
              toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
            } finally { setLoading(false); }
          }}
          disabled={loading}
          className="btn-primary bg-orange-600 hover:bg-orange-700 w-full justify-center"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Mengirim...</>
            : <><Bell className="w-4 h-4" /> Kirim Notifikasi ke Staff</>}
        </button>
      </div>
    );
  }

  // ─── PANTAUAN DI DIREKTUR ────────────────────────────────────
  if (["MENUNGGU_KEPUTUSAN_DIREKTUR", "DIPROSES_DIREKTUR", "DIJADWALKAN_KE_DIREKTUR"].includes(doc.currentStatus)) {
    return (
      <div className="card p-5 bg-yellow-50 border-yellow-200 space-y-3">
        <h3 className="font-semibold text-yellow-900">Pantauan Direktur</h3>
        <p className="text-sm text-yellow-800">
          {doc.currentStatus === "DIJADWALKAN_KE_DIREKTUR"
            ? "Dokumen sudah dijadwalkan — menunggu waktu pengiriman ke Direktur."
            : doc.currentStatus === "DIPROSES_DIREKTUR"
            ? "Direktur sudah membuka dokumen ini, menunggu keputusannya."
            : "Dokumen saat ini berada di meja Direktur menunggu keputusan."}
        </p>
        <button
          onClick={async () => {
            setLoading(true);
            try {
              const res = await fetch(`/api/documents/${doc.id}/remind-director`, { method: "POST" });
              const json = await res.json();
              if (!res.ok) throw new Error(json.error ?? "Gagal");
              toast.success("Pengingat berhasil dikirim ke Direktur!");
              router.refresh();
            } catch (e: unknown) {
              toast.error(e instanceof Error ? e.message : "Gagal");
            } finally { setLoading(false); }
          }}
          disabled={loading}
          className="btn-primary w-full justify-center bg-yellow-600 hover:bg-yellow-700 text-white"
        >
          {loading ? "Mengirim..." : "Ingatkan Direktur Sekarang"}
        </button>
      </div>
    );
  }

  return null;
}

function FormInfoRow({
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
        className={`text-xs text-gray-900 ml-1 ${mono ? "font-mono" : ""} ${multiline ? "whitespace-pre-wrap break-words" : "truncate"}`}
      >
        {value}
      </span>
    </div>
  );
}

function FormEditRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 px-3 py-2">
      <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">{label}</span>
      {children}
    </div>
  );
}
