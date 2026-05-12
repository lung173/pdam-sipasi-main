// app/dashboard/admin/surat-keluar/buat/page.tsx
import { redirect } from "next/navigation";
export default function BuatSuratKeluarRedirect() {
  redirect("/dashboard/admin/buat-surat?type=SURAT_KELUAR");
}
