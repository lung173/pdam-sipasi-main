// app/dashboard/admin/sk-direktur/buat/page.tsx
import { redirect } from "next/navigation";
export default function BuatSKDirekturRedirect() {
  redirect("/dashboard/admin/buat-surat?type=SK_DIREKTUR");
}
