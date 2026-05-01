// components/layout/AjukanSuratButton.tsx
"use client";
import { useState } from "react";
import { Send } from "lucide-react";
import { AjukanSuratModal } from "./AjukanSuratModal";

export function AjukanSuratButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-primary bg-green-600 hover:bg-green-700 gap-2"
      >
        <Send className="w-4 h-4" />
        Ajukan Surat
      </button>
      <AjukanSuratModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
