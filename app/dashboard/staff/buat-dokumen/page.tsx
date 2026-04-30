// app/dashboard/staff/buat-dokumen/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FileText, Loader2, ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { FileUpload } from "@/components/documents/FileUpload";

interface FormState {
  nomorSurat: string;
  perihal: string;
  deskripsi: string;
  tujuan: string;
  tanggalSurat: string;
}

export default function BuatDokumenPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    nomorSurat: "",
    perihal: "",
    deskripsi: "",
    tujuan: "",
    tanggalSurat: new Date().toISOString().split("T")[0],
  });
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [loading, setLoading] = useState(false);
  const [createdDocId, setCreatedDocId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: Partial<FormState> = {};
    if (!form.nomorSurat.trim()) newErrors.nomorSurat = "Nomor surat wajib diisi.";
    if (!form.perihal.trim() || form.perihal.length < 5)
      newErrors.perihal = "Perihal minimal 5 karakter.";
    if (!form.tanggalSurat) newErrors.tanggalSurat = "Tanggal surat wajib diisi.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal menyimpan.");
      toast.success("Dokumen berhasil dibuat! Silakan upload file draft.");
      setCreatedDocId(json.data.id);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitToAdmin = async () => {
    if (!createdDocId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/documents/${createdDocId}/submit`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal mengirim.");
      toast.success("Dokumen berhasil dikirim ke Admin!");
      router.push("/dashboard/staff/dokumen");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setSubmitting(false);
    }
  };

  const set = (key: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((p) => ({ ...p, [key]: e.target.value }));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/staff" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="page-title">Buat Dokumen Baru</h1>
          <p className="page-subtitle">Isi formulir di bawah untuk membuat surat/dokumen</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
          ${!createdDocId ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
          <span className="w-4 h-4 rounded-full bg-current/20 flex items-center justify-center text-[10px]">1</span>
          Isi Formulir
        </div>
        <div className="h-px w-6 bg-gray-300" />
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
          ${createdDocId ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
          <span className="w-4 h-4 rounded-full bg-current/20 flex items-center justify-center text-[10px]">2</span>
          Upload File
        </div>
        <div className="h-px w-6 bg-gray-300" />
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
          <span className="w-4 h-4 rounded-full bg-current/20 flex items-center justify-center text-[10px]">3</span>
          Kirim ke Admin
        </div>
      </div>

      {/* Form */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-gray-900">Informasi Dokumen</h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="form-label">Nomor Surat <span className="text-red-500">*</span></label>
            <input
              className="form-input"
              placeholder="Contoh: 001/ADM/PDAM/2025"
              value={form.nomorSurat}
              onChange={set("nomorSurat")}
              disabled={!!createdDocId}
            />
            {errors.nomorSurat && <p className="form-error">{errors.nomorSurat}</p>}
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="form-label">Tanggal Surat <span className="text-red-500">*</span></label>
            <input
              type="date"
              className="form-input"
              value={form.tanggalSurat}
              onChange={set("tanggalSurat")}
              disabled={!!createdDocId}
            />
            {errors.tanggalSurat && <p className="form-error">{errors.tanggalSurat}</p>}
          </div>
        </div>

        <div>
          <label className="form-label">Perihal <span className="text-red-500">*</span></label>
          <input
            className="form-input"
            placeholder="Perihal / pokok surat"
            value={form.perihal}
            onChange={set("perihal")}
            disabled={!!createdDocId}
          />
          {errors.perihal && <p className="form-error">{errors.perihal}</p>}
        </div>

        <div>
          <label className="form-label">Tujuan Surat</label>
          <input
            className="form-input"
            placeholder="Contoh: Direktur Utama PDAM"
            value={form.tujuan}
            onChange={set("tujuan")}
            disabled={!!createdDocId}
          />
        </div>

        <div>
          <label className="form-label">Keterangan / Deskripsi</label>
          <textarea
            className="form-input resize-none"
            rows={4}
            placeholder="Tuliskan deskripsi atau keterangan tambahan..."
            value={form.deskripsi}
            onChange={set("deskripsi")}
            disabled={!!createdDocId}
          />
        </div>

        {!createdDocId && (
          <button
            onClick={handleSave}
            disabled={loading}
            className="btn-primary w-full justify-center"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : "Simpan Dokumen"}
          </button>
        )}
      </div>

      {/* Step 2: Upload */}
      {createdDocId && (
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Upload File Draft</h2>
          <p className="text-sm text-gray-500">
            Upload file draft dokumen (PDF, JPG, atau PNG, maks. 10MB).
          </p>
          <FileUpload
            documentId={createdDocId}
            fileType="DRAFT"
            label="File Draft Dokumen"
          />
        </div>
      )}

      {/* Step 3: Submit */}
      {createdDocId && (
        <div className="card p-6 bg-blue-50 border-blue-200">
          <h2 className="font-semibold text-gray-900 mb-2">Kirim ke Admin</h2>
          <p className="text-sm text-gray-600 mb-4">
            Pastikan file draft sudah diupload sebelum mengirim. Dokumen yang sudah dikirim
            tidak dapat diedit hingga dikembalikan untuk revisi.
          </p>
          <div className="flex gap-3">
            <Link href="/dashboard/staff/dokumen" className="btn-secondary flex-1 justify-center">
              Simpan sebagai Draft
            </Link>
            <button
              onClick={handleSubmitToAdmin}
              disabled={submitting}
              className="btn-primary flex-1 justify-center"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Mengirim...</>
              ) : (
                <><Send className="w-4 h-4" /> Kirim ke Admin</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
