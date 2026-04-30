// components/documents/ArsipFilter.tsx
"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const BULAN = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];

export function ArsipFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const bulan = params.get("bulan") ?? "";
  const tahun = params.get("tahun") ?? "";

  const update = useCallback((key: string, val: string) => {
    const sp = new URLSearchParams(params.toString());
    if (val) sp.set(key, val);
    else sp.delete(key);
    router.push(`?${sp.toString()}`);
  }, [params, router]);

  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => thisYear - i);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm font-medium text-gray-600">Filter:</span>
      <select
        value={bulan}
        onChange={(e) => update("bulan", e.target.value)}
        className="form-input py-1.5 text-sm w-36"
      >
        <option value="">Semua Bulan</option>
        {BULAN.map((b, i) => (
          <option key={i + 1} value={String(i + 1)}>{b}</option>
        ))}
      </select>
      <select
        value={tahun}
        onChange={(e) => update("tahun", e.target.value)}
        className="form-input py-1.5 text-sm w-28"
      >
        <option value="">Semua Tahun</option>
        {years.map((y) => (
          <option key={y} value={String(y)}>{y}</option>
        ))}
      </select>
      {(bulan || tahun) && (
        <button
          onClick={() => router.push("?")}
          className="text-xs text-red-500 hover:text-red-700 underline"
        >
          Reset
        </button>
      )}
    </div>
  );
}
