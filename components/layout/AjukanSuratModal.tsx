// components/layout/AjukanSuratModal.tsx
"use client";
import { useState, useRef, DragEvent } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  X, Send, Loader2, Upload, FileText, Image,
  CheckCircle2, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AjukanSuratModal({ open, onClose }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [perihal, setPerihal] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [step, setStep] = useState<"form" | "sending" | "done">("form");
  const [error, setError] = useState("");

  const ALLOWED = ["application/pdf", "image/jpeg", "image/png"];
  const MAX_MB = 20;

  const reset = () => {
    setPerihal("");
    setSelectedFile(null);
    setDragging(false);
    setStep("form");
    setError("");
  };

  const handleClose = () => {
    if (step === "sending") return; // Don't close while sending
    reset();
    onClose();
  };

  const validateAndSet = (file: File) => {
    if (!ALLOWED.includes(file.type)) {
      toast.error("File harus berformat PDF, JPG, atau PNG.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`Ukuran file tidak boleh lebih dari ${MAX_MB}MB.`);
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndSet(file);
  };

  const handleSubmit = async () => {
    // Validate
    if (!perihal.trim() || perihal.length < 5) {
      setError("Perihal minimal 5 karakter.");
      return;
    }
    if (!selectedFile) {
      setError("File draft dokumen wajib diupload.");
      return;
    }

    setError("");
    setStep("sending");

    try {
      // Step 1: Create document (nomor surat di-generate otomatis oleh server)
      const createRes = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          perihal: perihal.trim(),
          tanggalSurat: new Date().toISOString().split("T")[0],
        }),
      });
      const createJson = await createRes.json();
      if (!createRes.ok) throw new Error(createJson.error ?? "Gagal membuat dokumen.");
      const docId = createJson.data.id;

      // Step 2: Upload file
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("fileType", "DRAFT");

      const uploadRes = await fetch(`/api/documents/${docId}/upload`, {
        method: "POST",
        body: formData,
      });
      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadJson.error ?? "Gagal upload file.");

      // Step 3: Submit to admin
      const submitRes = await fetch(`/api/documents/${docId}/submit`, {
        method: "POST",
      });
      const submitJson = await submitRes.json();
      if (!submitRes.ok) throw new Error(submitJson.error ?? "Gagal mengirim ke Admin.");

      setStep("done");
      toast.success("Surat berhasil diajukan ke Admin!");

      // Refresh after short delay so user sees success
      setTimeout(() => {
        handleClose();
        router.refresh();
      }, 1500);
    } catch (err: unknown) {
      setStep("form");
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      setError(msg);
      toast.error(msg);
    }
  };

  if (!open) return null;

  const FileIcon = selectedFile?.type === "application/pdf" ? FileText : Image;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Send className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Ajukan Surat</h3>
              <p className="text-xs text-gray-500">Kirim langsung ke Admin</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={step === "sending"}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Done state */}
        {step === "done" && (
          <div className="px-6 py-10 text-center space-y-3">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
            <p className="font-semibold text-gray-900">Surat Berhasil Diajukan!</p>
            <p className="text-sm text-gray-500">
              Surat Anda telah dikirim ke Admin untuk diproses.
            </p>
          </div>
        )}

        {/* Form / Sending */}
        {step !== "done" && (
          <>
            <div className="px-6 py-5 space-y-4">
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              {/* Info: nomor surat diisi Agendaris */}
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                  Nomor surat akan diberikan oleh <strong>Agendaris</strong> setelah surat diterima.
                </p>
              </div>

              {/* Perihal */}
              <div>
                <label className="form-label">
                  Perihal <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="form-input resize-none"
                  rows={3}
                  placeholder="Tuliskan perihal / pokok surat..."
                  value={perihal}
                  onChange={(e) => setPerihal(e.target.value)}
                  disabled={step === "sending"}
                />
              </div>

              {/* File upload */}
              <div>
                <label className="form-label">
                  File Dokumen <span className="text-red-500">*</span>
                </label>
                <div
                  onClick={() => step !== "sending" && inputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  className={cn(
                    "relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors",
                    dragging
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-blue-400 hover:bg-gray-50",
                    step === "sending" && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    disabled={step === "sending"}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) validateAndSet(f);
                    }}
                  />

                  {selectedFile ? (
                    <div className="flex flex-col items-center gap-1.5">
                      <FileIcon className="w-8 h-8 text-blue-500" />
                      <p className="text-sm font-medium text-gray-900 truncate max-w-[240px]">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                        className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 mt-0.5"
                      >
                        <X className="w-3 h-3" /> Ganti file
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5">
                      <Upload className="w-8 h-8 text-gray-400" />
                      <p className="text-sm text-gray-700 font-medium">Klik atau drop file</p>
                      <p className="text-xs text-gray-400">PDF, JPG, PNG — Maks. {MAX_MB}MB</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 px-6 pb-5">
              <button
                onClick={handleClose}
                disabled={step === "sending"}
                className="btn-secondary flex-1 justify-center"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={step === "sending"}
                className="btn-primary flex-1 justify-center"
              >
                {step === "sending" ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Mengirim...</>
                ) : (
                  <><Send className="w-4 h-4" /> Ajukan Surat</>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
