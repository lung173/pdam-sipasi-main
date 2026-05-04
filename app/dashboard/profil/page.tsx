"use client";
import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { Loader2, Upload, UserCog, Save } from "lucide-react";

export default function ProfilPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [previewBase64, setPreviewBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/users/profile")
      .then(r => r.json())
      .then(d => {
        if (d.data?.signature) {
          setSignature(d.data.signature);
        }
      });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
      toast.error("Hanya file PNG atau JPG yang diizinkan.");
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran maksimal file tanda tangan adalah 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewBase64(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const saveSignature = async () => {
    if (!previewBase64) return;
    setLoading(true);
    try {
      const res = await fetch("/api/users/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature: previewBase64 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menyimpan");
      
      setSignature(previewBase64);
      setPreviewBase64(null);
      toast.success("Tanda tangan berhasil disimpan!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <UserCog className="w-6 h-6 text-blue-600" /> Pengaturan Profil
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Kelola informasi profil dan tanda tangan digital Anda.
        </p>
      </div>

      <div className="card p-6 space-y-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 border-b pb-2">Informasi Akun</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Nama Lengkap</p>
              <p className="font-medium text-gray-900">{session?.user?.name}</p>
            </div>
            <div>
              <p className="text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{session?.user?.email}</p>
            </div>
            <div>
              <p className="text-gray-500">Peran / Jabatan</p>
              <p className="font-medium text-gray-900">{session?.user?.role}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-semibold text-gray-900">Tanda Tangan Digital</h3>
          <p className="text-sm text-gray-500">
            Unggah gambar tanda tangan Anda di sini. Gambar ini akan digunakan secara otomatis pada Lembar Disposisi yang Anda setujui.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="flex-1 space-y-2 w-full">
              <p className="text-xs font-semibold text-gray-600 uppercase">Tampilan Tanda Tangan</p>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex items-center justify-center bg-gray-50 min-h-[120px] relative">
                {(previewBase64 || signature) ? (
                  <img src={previewBase64 || signature!} alt="Tanda Tangan" className="max-h-24 max-w-full object-contain mix-blend-multiply" />
                ) : (
                  <span className="text-sm text-gray-400">Belum ada tanda tangan</span>
                )}
                
                {previewBase64 && (
                  <div className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-md font-medium">
                    Belum Disimpan
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-3 w-full">
              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary w-full justify-center"
              >
                <Upload className="w-4 h-4" /> Pilih Gambar Tanda Tangan
              </button>
              
              <p className="text-xs text-gray-500 text-center">
                Format: PNG/JPG (Maks. 2MB). Disarankan menggunakan gambar dengan latar transparan (PNG).
              </p>

              {previewBase64 && (
                <button
                  onClick={saveSignature}
                  disabled={loading}
                  className="btn-primary w-full justify-center mt-4"
                >
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : <><Save className="w-4 h-4" /> Simpan Tanda Tangan</>}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
