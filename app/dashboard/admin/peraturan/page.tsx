// app/dashboard/admin/peraturan/page.tsx
"use client";
import { DocumentTypeListPage } from "@/components/documents/DocumentTypeListPage";
import { ScrollText } from "lucide-react";

export default function PeraturanDirekturPage() {
  return (
    <DocumentTypeListPage
      documentType="PERATURAN_DIREKTUR"
      title="Peraturan Direktur"
      description="Kelola peraturan yang dikeluarkan Direktur — buat, proses, dan arsipkan."
      icon={ScrollText}
      iconColor="text-orange-600"
      basePath="/dashboard/admin/peraturan"
      showCreateButton={true}
      createLabel="Buat Peraturan"
    />
  );
}
