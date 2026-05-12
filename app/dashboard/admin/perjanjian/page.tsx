// app/dashboard/admin/perjanjian/page.tsx
"use client";
import { DocumentTypeListPage } from "@/components/documents/DocumentTypeListPage";
import { Handshake } from "lucide-react";

export default function PerjanjianPage() {
  return (
    <DocumentTypeListPage
      documentType="PERJANJIAN"
      title="Perjanjian"
      description="Kelola surat perjanjian — buat, proses persetujuan, dan arsipkan."
      icon={Handshake}
      iconColor="text-cyan-600"
      basePath="/dashboard/admin/perjanjian"
      showCreateButton={true}
      createLabel="Buat Perjanjian"
    />
  );
}
