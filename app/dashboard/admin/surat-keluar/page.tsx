// app/dashboard/admin/surat-keluar/page.tsx
"use client";
import { DocumentTypeListPage } from "@/components/documents/DocumentTypeListPage";
import { Send } from "lucide-react";

export default function SuratKeluarPage() {
  return (
    <DocumentTypeListPage
      documentType="SURAT_KELUAR"
      title="Surat Keluar"
      description="Kelola surat keluar ke instansi lain — buat, kirim, dan arsipkan."
      icon={Send}
      iconColor="text-emerald-600"
      basePath="/dashboard/admin/surat-keluar"
      showCreateButton={true}
      createLabel="Buat Surat Keluar"
    />
  );
}
