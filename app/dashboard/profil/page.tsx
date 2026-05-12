// app/dashboard/profil/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { User, Camera, Save, Loader2, UserCircle, Briefcase, GraduationCap, ArrowLeft, PencilLine, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
// import { SignaturePad } from "@/components/ui/SignaturePad";

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: session?.user?.name || "",
    title: session?.user?.title || "",
    image: session?.user?.image || "",
    // signature: session?.user?.signature || "",
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memperbarui profil.");

      // Update local session
      await update({
        ...session,
        user: {
          ...session?.user,
          name: formData.name,
          title: formData.title,
          image: formData.image,
          // signature: formData.signature,
        },
      });

      toast.success("Profil berhasil diperbarui!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, image: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="page-header !justify-start">
          <button
            onClick={() => router.back()}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50 dark:hover:bg-slate-700/50 transition-all shadow-sm group"
            title="Kembali"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <h1 className="page-title text-2xl font-bold">Pengaturan Profil</h1>
            <p className="page-subtitle">Kelola informasi publik dan identitas Anda di sistem</p>
          </div>
        </div>

        <div className="card overflow-hidden shadow-xl shadow-gray-200/50 dark:shadow-black/20">
          <div className="h-32 bg-gradient-to-r from-blue-600 to-blue-400 relative">
            <div className="absolute -bottom-12 left-8">
              <div className="relative group">
                <div className="w-24 h-24 rounded-2xl bg-white dark:bg-slate-800 p-1 shadow-lg overflow-hidden">
                  {formData.image ? (
                    <img src={formData.image} alt="Profile" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <div className="w-full h-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center rounded-xl">
                      <UserCircle className="w-12 h-12 text-gray-300 dark:text-slate-500" />
                    </div>
                  )}
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-2xl opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  <Camera className="w-6 h-6" />
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="pt-16 pb-8 px-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nama Lengkap */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-500" /> Nama Lengkap
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input focus:ring-blue-500/20"
                  placeholder="Contoh: Budi Santoso"
                  required
                />
              </div>

              {/* Gelar */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-blue-500" /> Gelar Lengkap
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="form-input focus:ring-blue-500/20"
                  placeholder="Contoh: S.T., M.Kom."
                />
                <p className="text-[10px] text-slate-400 dark:text-slate-500">Gelar akan ditampilkan setelah nama di Top Bar.</p>
              </div>

              {/* Email (Read Only) */}
              <div className="space-y-2 opacity-60">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-slate-400 dark:text-slate-500" /> Email Akun
                </label>
                <input
                  type="email"
                  value={session?.user?.email || ""}
                  disabled
                  className="form-input bg-gray-50 cursor-not-allowed"
                />
              </div>

              {/* Divisi (Read Only) */}
              <div className="space-y-2 opacity-60">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-slate-400 dark:text-slate-500" /> Unit / Divisi
                </label>
                <input
                  type="text"
                  value={session?.user?.divisi || "-"}
                  disabled
                  className="form-input bg-slate-50 dark:bg-slate-800 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Bagian Khusus Direktur: Tanda Tangan */}
            {/* {session?.user?.role === "DIREKTUR" && (
              <div className="pt-6 border-t border-gray-100 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <PencilLine className="w-4 h-4 text-blue-500" /> Tanda Tangan Digital
                  </label>
                  <label className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer flex items-center gap-1 font-medium bg-blue-50 px-2 py-1 rounded">
                    <ImageIcon className="w-3 h-3" /> Unggah Foto TTD
                    <input type="file" className="hidden" accept="image/*" onChange={handleSignaturePhotoUpload} />
                  </label>
                </div>

                <SignaturePad
                  initialValue={formData.signature}
                  onSave={(base64) => setFormData({ ...formData, signature: base64 })}
                />

                <p className="text-[10px] text-gray-400">
                  Tanda tangan ini akan digunakan secara otomatis pada lembar disposisi dan dokumen resmi lainnya.
                </p>
              </div>
            )} */}

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary px-8 py-2.5 flex items-center gap-2 shadow-lg shadow-blue-200 dark:shadow-blue-900/20"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                ) : (
                  <><Save className="w-4 h-4" /> Simpan Perubahan</>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="card p-6 bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30 flex items-start gap-4">
          <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
            <InfoRowIcon />
          </div>
          <div>
            <h4 className="text-sm font-bold text-blue-900 dark:text-blue-400">Informasi Keamanan</h4>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1 leading-relaxed">
              Untuk alasan keamanan, email dan divisi hanya dapat diubah oleh Admin Agendaris.
              Pastikan nama dan gelar Anda sesuai dengan data kepegawaian resmi.
            </p>
          </div>
        </div>
      </div>
    );
  }

  function InfoRowIcon() {
    return (
      <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }