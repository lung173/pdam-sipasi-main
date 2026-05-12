// app/dashboard/admin/surat-masuk/buat/page.tsx
import { redirect } from "next/navigation";
export default function BuatSuratMasukRedirect() {
  redirect("/dashboard/admin/buat-surat?type=SURAT_MASUK");
}
