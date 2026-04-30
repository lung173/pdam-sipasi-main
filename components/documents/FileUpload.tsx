// components/documents/FileUpload.tsx
"use client";
import { useState, useRef, DragEvent } from "react";
import { Upload, X, FileText, Image, Loader2, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

interface Props {
  documentId: string;
  fileType: "DRAFT" | "FINAL_SCAN" | "ATTACHMENT";
  onSuccess?: () => void;
  label?: string;
  disabled?: boolean;
}

export function FileUpload({ documentId, fileType, onSuccess, label, disabled }: Props) {
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const ALLOWED = ["application/pdf", "image/jpeg", "image/png"];
  const MAX_MB = 10;

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
    setDone(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndSet(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("fileType", fileType);

      const res = await fetch(`/api/documents/${documentId}/upload`, {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload gagal.");

      toast.success("File berhasil diupload!");
      setDone(true);
      setSelectedFile(null);
      onSuccess?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload gagal.");
    } finally {
      setUploading(false);
    }
  };

  const fileIcon = selectedFile?.type === "application/pdf" ? FileText : Image;
  const FileIcon = fileIcon;

  return (
    <div className="space-y-3">
      {label && <p className="form-label">{label}</p>}

      {/* Drop zone */}
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors",
          dragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50",
          disabled && "opacity-50 cursor-not-allowed",
          done && "border-green-400 bg-green-50"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          disabled={disabled}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) validateAndSet(f); }}
        />

        {done ? (
          <div className="flex flex-col items-center gap-2">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
            <p className="text-sm text-green-700 font-medium">File berhasil diupload!</p>
          </div>
        ) : selectedFile ? (
          <div className="flex flex-col items-center gap-2">
            <FileIcon className="w-10 h-10 text-blue-500" />
            <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
              {selectedFile.name}
            </p>
            <p className="text-xs text-gray-400">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
              className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 mt-1"
            >
              <X className="w-3 h-3" /> Hapus pilihan
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-10 h-10 text-gray-400" />
            <p className="text-sm text-gray-700 font-medium">Klik atau drop file di sini</p>
            <p className="text-xs text-gray-400">PDF, JPG, PNG — Maks. {MAX_MB}MB</p>
          </div>
        )}
      </div>

      {/* Upload button */}
      {selectedFile && !done && (
        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading || disabled}
          className="btn-primary w-full justify-center"
        >
          {uploading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Mengupload...</>
          ) : (
            <><Upload className="w-4 h-4" /> Upload File</>
          )}
        </button>
      )}
    </div>
  );
}
