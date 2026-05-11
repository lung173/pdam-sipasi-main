// components/documents/DokumenSearch.tsx
"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { Search, Calendar, Filter, X, RotateCcw } from "lucide-react";

export function DokumenSearch() {
  const router = useRouter();
  const params = useSearchParams();
  
  const [q, setQ] = useState(params.get("q") ?? "");
  const [date, setDate] = useState(params.get("date") ?? "");

  const handleSearch = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    const sp = new URLSearchParams(params.toString());

    if (q) sp.set("q", q);
    else sp.delete("q");

    if (date) sp.set("date", date);
    else sp.delete("date");

    sp.delete("page");

    router.push(`?${sp.toString()}`);
  }, [q, date, params, router]);

  const handleReset = () => {
    setQ("");
    setDate("");
    router.push("?");
  };

  const handleClearQ = () => {
    setQ("");
    const sp = new URLSearchParams(params.toString());
    sp.delete("q");
    router.push(`?${sp.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200/80">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4">
        {/* Search Input */}
        <div className="md:col-span-6 relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
          </div>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari perihal, pengirim, atau nomor surat..."
            className="w-full pl-10 pr-10 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm transition-all outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder-gray-400 text-gray-800"
          />
          {q && (
            <button
              type="button"
              onClick={handleClearQ}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* Date Input */}
        <div className="md:col-span-4 relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Calendar className="h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm transition-all outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-gray-700"
          />
        </div>

        {/* Action Buttons */}
        <div className="md:col-span-2 flex items-center">
          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all shadow-sm shadow-blue-600/20 active:scale-[0.98]"
          >
            Terapkan
          </button>
        </div>
      </div>
    </form>
  );
}
