// app/dashboard/admin/undangan/buat/page.tsx
import { redirect } from "next/navigation";
export default function BuatUndanganRedirect() {
  redirect("/dashboard/admin/buat-surat?type=UNDANGAN");
}
