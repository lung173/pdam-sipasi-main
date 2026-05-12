// app/dashboard/admin/buat-surat/page.tsx
"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  FileText, Loader2, ArrowLeft, Send, Calendar, MailOpen,
  Briefcase, Award, Handshake, ScrollText, Plus,
} from "lucide-react";
import { FileUpload } from "@/components/documents/FileUpload";
import { DOCUMENT_TYPE_LABELS, CATEGORY_LABELS } from "@/types";
import type { DocumentType, DocumentCategory } from "@prisma/client";

const DOC_TYPE_OPTIONS: { type: DocumentType; label: string; icon: React.ElementType; color: string }[] = [
  { type: "UNDANGAN",           label: "Undangan",           icon: Calendar,   color: "border-purple-200 bg-purple-50 text-purple-800 hover:border-purple-500" },
  { type: "SURAT_MASUK",        label: "Surat Masuk",        icon: MailOpen,   color: "border-blue-200 bg-blue-50 text-blue-800 hover:border-blue-500" },
  { type: "SURAT_TUGAS",        label: "Surat Tugas",        icon: Briefcase,  color: "border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-500" },
  { type: "SURAT_KELUAR",       label: "Surat Keluar",       icon: Send,       color: "border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-500" },
  { type: "SK_DIREKTUR",        label: "SK Direktur",        icon: Award,      color: "border-red-200 bg-red-50 text-red-800 hover:border-red-500" },
  { type: "PERJANJIAN",         label: "Perjanjian",         icon: Handshake,  color: "border-cyan-200 bg-cyan-50 text-cyan-800 hover:border-cyan-500" },
  { type: "PERATURAN_DIREKTUR", label: "Peraturan Direktur", icon: ScrollText, color: "border-orange-200 bg-orange-50 text-orange-800 hover:border-orange-500" },
];

const CATEGORY_OPTIONS: DocumentCategory[] = [
  "UNDANGAN", "PEMBELIAN", "KERJASAMA", "KEPEGAWAIAN",
  "KEUANGAN", "PERIZINAN", "PENGADAAN", "HUKUM", "TEKNIK", "DLL",
];

function BuatSuratContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedType = searchParams.get("type") as DocumentType | null;

  const [form, setForm] = useState({
    nomorSurat: "",
    perihal: "",
    deskripsi: "",
    tujuan: "",
    asalSurat: "",
    tanggalSurat: new Date().toISOString().split("T")[0],
    documentType: preselectedType || ("SURAT_MASUK" as DocumentType),
    category: "DLL" as DocumentCategory,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [createdDocId, setCreatedDocId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
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
      toast.success("Dokumen berhasil dibuat! Silakan upload file.");
      setCreatedDocId(json.data.id);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!createdDocId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/documents/${createdDocId}/submit`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal mengirim.");
      toast.success("Dokumen berhasil diproses!");
      // Navigate to the corresponding document type page
      const typeRoutes: Record<string, string> = {
        UNDANGAN: "/dashboard/admin/undangan",
        SURAT_MASUK: "/dashboard/admin/surat-masuk",
        SURAT_TUGAS: "/dashboard/admin/surat-tugas",
        SURAT_KELUAR: "/dashboard/admin/surat-keluar",
        SK_DIREKTUR: "/dashboard/admin/sk-direktur",
        PERJANJIAN: "/dashboard/admin/perjanjian",
        PERATURAN_DIREKTUR: "/dashboard/admin/peraturan",
      };
      router.push(typeRoutes[form.documentType] ?? "/dashboard/admin");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setSubmitting(false);
    }
  };

  const set = (key: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const selectedTypeInfo = DOC_TYPE_OPTIONS.find(t => t.type === form.documentType);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/admin" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Plus className="w-6 h-6 text-blue-600" />
            Buat Dokumen Baru
          </h1>
          <p className="page-subtitle">Agendaris — Buat surat baru dari 7 jenis dokumen</p>
        </div>
      </div>

      {/* Step 1: Pilih Jenis Surat */}
      {!createdDocId && (
        <div className="card p-6 space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">1. Pilih Jenis Surat</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {DOC_TYPE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = form.documentType === opt.type;
              return (
                <button
                  key={opt.type}
                  onClick={() => setForm(p => ({ ...p, documentType: opt.type }))}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-sm font-medium transition-all cursor-pointer
                    ${isSelected
                      ? `${opt.color} ring-2 ring-offset-1 ring-current shadow-md scale-[1.02]`
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-xs text-center leading-tight">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 2: Form */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-gray-900">
            {createdDocId ? "Dokumen Tersimpan" : "2. Informasi Dokumen"}
          </h2>
          {selectedTypeInfo && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${selectedTypeInfo.color}`}>
              {selectedTypeInfo.label}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="form-label">Nomor Surat <span className="text-gray-400 text-xs">(opsional, auto-generate)</span></label>
            <input
              className="form-input"
              placeholder="Contoh: 001/ADM/PDAM/2025"
              value={form.nomorSurat}
              onChange={set("nomorSurat")}
              disabled={!!createdDocId}
            />
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

        <div className="grid grid-cols-2 gap-4">
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
            <label className="form-label">Asal Surat</label>
            <input
              className="form-input"
              placeholder="Contoh: Dinas PU Kota Malang"
              value={form.asalSurat}
              onChange={set("asalSurat")}
              disabled={!!createdDocId}
            />
          </div>
        </div>

        <div>
          <label className="form-label">Keterangan / Deskripsi</label>
          <textarea
            className="form-input resize-none"
            rows={3}
            placeholder="Tuliskan deskripsi atau keterangan tambahan..."
            value={form.deskripsi}
            onChange={set("deskripsi")}
            disabled={!!createdDocId}
          />
        </div>

        {/* Kategori Keperluan — satu per satu */}
        <div>
          <label className="form-label">Kategori Keperluan</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {CATEGORY_OPTIONS.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => !createdDocId && setForm(p => ({ ...p, category: cat }))}
                disabled={!!createdDocId}
                className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all text-center
                  ${form.category === cat
                    ? "border-blue-500 bg-blue-50 text-blue-800 ring-1 ring-blue-300"
                    : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  }
                  ${createdDocId ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
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

      {/* Step 3: Upload */}
      {createdDocId && (
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">3. Upload File Dokumen</h2>
          <p className="text-sm text-gray-500">
            Upload file scan dokumen (PDF, JPG, atau PNG, maks. 10MB).
          </p>
          <FileUpload
            documentId={createdDocId}
            fileType="DRAFT"
            label="File Scan Dokumen"
          />
        </div>
      )}

      {/* Step 4: Submit / Selesai */}
      {createdDocId && (
        <div className="card p-6 bg-blue-50 border-blue-200">
          <h2 className="font-semibold text-gray-900 mb-2">4. Selesai</h2>
          <p className="text-sm text-gray-600 mb-4">
            Dokumen sudah tersimpan. Anda bisa langsung memprosesnya atau menyimpan sebagai draft.
          </p>
          <div className="flex gap-3">
            <Link 
              href={`/dashboard/admin/dokumen/${createdDocId}`}
              className="btn-secondary flex-1 justify-center"
            >
              Lihat Dokumen
            </Link>
            <button
              onClick={handleSubmitForReview}
              disabled={submitting}
              className="btn-primary flex-1 justify-center"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
              ) : (
                <><Send className="w-4 h-4" /> Proses Dokumen</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BuatSuratPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>}>
      <BuatSuratContent />
    </Suspense>
  );
}
