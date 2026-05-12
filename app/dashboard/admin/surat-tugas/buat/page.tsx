// app/dashboard/admin/surat-tugas/buat/page.tsx
import { redirect } from "next/navigation";
export default function BuatSuratTugasRedirect() {
  redirect("/dashboard/admin/buat-surat?type=SURAT_TUGAS");
}
