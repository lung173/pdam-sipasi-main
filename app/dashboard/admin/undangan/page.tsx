// app/dashboard/admin/undangan/page.tsx
"use client";
import { DocumentTypeListPage } from "@/components/documents/DocumentTypeListPage";
import { Calendar } from "lucide-react";

export default function UndanganPage() {
  return (
    <DocumentTypeListPage
      documentType="UNDANGAN"
      title="Daftar Undangan"
      description="Kelola undangan internal & external — buat, lacak, dan arsipkan."
      icon={Calendar}
      iconColor="text-purple-600"
      basePath="/dashboard/admin/undangan"
      showCreateButton={true}
      createLabel="Buat Undangan"
    />
  );
}
