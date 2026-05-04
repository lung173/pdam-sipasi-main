"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow flex items-center gap-2 transition-colors"
      title="Gunakan opsi 'Save as PDF' di browser untuk mengunduh"
    >
      <span>🖨️</span> Cetak / Simpan PDF
    </button>
  );
}
