// hooks/useDocuments.ts
"use client";
import { useState, useEffect, useCallback } from "react";
import { DocumentListItem, DocumentStatus } from "@/types";

interface UseDocumentsOptions {
  status?: DocumentStatus;
  search?: string;
  page?: number;
  limit?: number;
}

interface UseDocumentsResult {
  documents: DocumentListItem[];
  total: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDocuments(options: UseDocumentsOptions = {}): UseDocumentsResult {
  const { status, search = "", page = 1, limit = 20 } = options;
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  const refetch = useCallback(() => setTrigger((n) => n + 1), []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (search) params.set("search", search);
    params.set("page", String(page));
    params.set("limit", String(limit));

    setLoading(true);
    fetch(`/api/documents?${params}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setDocuments(json.data.data);
          setTotal(json.data.total);
          setTotalPages(json.data.totalPages);
          setError(null);
        } else {
          setError(json.error ?? "Gagal memuat dokumen.");
        }
      })
      .catch(() => setError("Koneksi gagal."))
      .finally(() => setLoading(false));
  }, [status, search, page, limit, trigger]);

  return { documents, total, totalPages, loading, error, refetch };
}
