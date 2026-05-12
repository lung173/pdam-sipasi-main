// app/dashboard/admin/surat-tugas/page.tsx
"use client";
import { DocumentTypeListPage } from "@/components/documents/DocumentTypeListPage";
import { Briefcase } from "lucide-react";

export default function SuratTugasPage() {
  return (
    <DocumentTypeListPage
      documentType="SURAT_TUGAS"
      title="Surat Tugas"
      description="Kelola surat tugas — buat, lacak penugasan, dan arsipkan."
      icon={Briefcase}
      iconColor="text-amber-600"
      basePath="/dashboard/admin/surat-tugas"
      showCreateButton={true}
      createLabel="Buat Surat Tugas"
    />
  );
}
