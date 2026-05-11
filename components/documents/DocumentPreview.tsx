// components/documents/DocumentPreview.tsx
"use client";
import { X, ExternalLink, Download, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface DocumentPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
}

export function DocumentPreview({ isOpen, onClose, fileUrl, fileName }: DocumentPreviewProps) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => { document.body.style.overflow = "auto"; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Content */}
      <div className="relative bg-white w-full h-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 truncate">{fileName}</h3>
            <p className="text-xs text-gray-500">Preview Dokumen</p>
          </div>
          <div className="flex items-center gap-2">
            <a 
              href={fileUrl} 
              target="_blank" 
              rel="noreferrer"
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Buka di tab baru"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
            <a 
              href={fileUrl} 
              download={fileName}
              className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              title="Unduh"
            >
              <Download className="w-5 h-5" />
            </a>
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 bg-gray-100 relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-sm font-medium text-gray-600">Memuat preview...</p>
              </div>
            </div>
          )}
          <iframe 
            src={fileUrl} 
            className="w-full h-full border-none"
            onLoad={() => setLoading(false)}
          />
        </div>
      </div>
    </div>
  );
}
