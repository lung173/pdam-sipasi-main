// app/dashboard/admin/surat-masuk/page.tsx
"use client";
import { DocumentTypeListPage } from "@/components/documents/DocumentTypeListPage";
import { MailOpen } from "lucide-react";

export default function SuratMasukPage() {
  return (
    <DocumentTypeListPage
      documentType="SURAT_MASUK"
      title="Surat Masuk"
      description="Kelola surat masuk internal — terima, review, dan proses."
      icon={MailOpen}
      iconColor="text-blue-600"
      basePath="/dashboard/admin/surat-masuk"
      showCreateButton={true}
      createLabel="Catat Surat Masuk"
    />
  );
}
