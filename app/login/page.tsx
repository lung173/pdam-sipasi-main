// app/login/page.tsx
"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Eye, EyeOff, Loader2, FileText } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email: form.email.trim().toLowerCase(),
        password: form.password,
        redirect: false,
      });

      if (res?.error) {
        setError("Email atau password salah. Silakan coba lagi.");
        toast.error("Login gagal.");
      } else {
        toast.success("Login berhasil! Mengalihkan...");
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan. Coba lagi nanti.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/5 rounded-full" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-4 border border-white/20">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">SIPAS PDAM</h1>
          <p className="text-blue-100 text-sm mt-1 font-medium">
            Sistem Informasi Pengelolaan Arsip Surat
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10 transition-all">
          <h2 className="text-xl font-bold text-slate-900 mb-1">Masuk ke Sistem</h2>
          <p className="text-sm text-slate-500 mb-8">
            Gunakan akun yang telah diberikan oleh Administrator.
          </p>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="form-label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                placeholder="nama@pdam.go.id"
                className="form-input"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label className="form-label" htmlFor="password">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="Masukkan password"
                  className="form-input pr-10"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  disabled={loading}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3.5 text-base font-bold"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                "Masuk"
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <details className="mt-8 group">
            <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600 select-none flex items-center gap-2">
              <span className="font-bold">Akun Demo (Development)</span>
              <div className="h-px flex-1 bg-slate-100" />
            </summary>
            <div className="mt-4 text-[11px] text-slate-500 space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="font-bold text-slate-700">Admin Staff 1:</span> staff@pdam.go.id</div>
                <div><span className="font-bold text-slate-700">Admin Staff 2:</span> staff2@pdam.go.id</div>
                <div><span className="font-bold text-slate-700">Agendaris:</span> agendaris@pdam.go.id</div>
                <div><span className="font-bold text-slate-700">Direktur:</span> direktur@pdam.go.id</div>
                <div><span className="font-bold text-slate-700">Kabag:</span> kabag@pdam.go.id</div>
              </div>
              <p className="mt-2 text-slate-400 italic">Password standar: Nama@12345 (contoh: Staff@12345)</p>
            </div>
          </details>
        </div>

        <p className="text-center text-blue-100 text-[10px] font-bold uppercase tracking-widest mt-8 opacity-80">
          © {new Date().getFullYear()} PDAM • Sistem Informasi Pengelolaan Arsip Surat
        </p>
      </div>
    </div>
  );
}
