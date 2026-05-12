// app/dashboard/admin/perjanjian/buat/page.tsx
import { redirect } from "next/navigation";
export default function BuatPerjanjianRedirect() {
  redirect("/dashboard/admin/buat-surat?type=PERJANJIAN");
}
