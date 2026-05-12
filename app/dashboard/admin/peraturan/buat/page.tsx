// app/dashboard/admin/peraturan/buat/page.tsx
import { redirect } from "next/navigation";
export default function BuatPeraturanRedirect() {
  redirect("/dashboard/admin/buat-surat?type=PERATURAN_DIREKTUR");
}
