// app/dashboard/admin/sk-direktur/page.tsx
"use client";
import { DocumentTypeListPage } from "@/components/documents/DocumentTypeListPage";
import { Award } from "lucide-react";

export default function SKDirekturPage() {
  return (
    <DocumentTypeListPage
      documentType="SK_DIREKTUR"
      title="SK Direktur"
      description="Kelola Surat Keputusan Direktur — buat, proses, dan arsipkan."
      icon={Award}
      iconColor="text-red-600"
      basePath="/dashboard/admin/sk-direktur"
      showCreateButton={true}
      createLabel="Buat SK Direktur"
    />
  );
}
