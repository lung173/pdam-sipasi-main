import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Droplets, ShieldCheck, Activity } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 flex flex-col font-sans">
      {/* Background Decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-sky-200/50 rounded-full blur-3xl animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[50%] bg-cyan-200/50 rounded-full blur-3xl animate-pulse-slow object-right-bottom"></div>

      {/* Navbar Section */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Droplets className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 tracking-tight">
            SIPAS PDAM
          </span>
        </div>
        <div>
          <Link href="/login" className="btn-secondary">
            Masuk Sistem
          </Link>
        </div>
      </nav>

      {/* Main Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 w-full max-w-6xl mx-auto mt-12 mb-24">
        <div className="text-center max-w-3xl glass-panel p-10 md:p-16 relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-50/80 border border-cyan-100 text-cyan-700 font-medium text-sm mb-6 animate-float">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
            Sistem Informasi Pengelolaan Alur Surat
          </div>
          
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
            Kelola Persuratan PDAM dengan <br className="hidden md:block"/>
            <span className="gradient-text"> Cepat & Akurat.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Platform modern untuk memfasilitasi kebutuhan administrasi dan arsip Perusahaan Daerah Air Minum secara digital dan terintegrasi.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login" className="btn-primary w-full sm:w-auto">
              Masuk Dashboard <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#features" className="btn-secondary w-full sm:w-auto border-transparent !bg-transparent hover:!bg-slate-100/50 text-slate-500 hover:text-slate-800 shadow-none">
              Pelajari Lebih Lanjut
            </a>
          </div>
        </div>

        {/* Features Preview */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full">
          {[
            { icon: <Activity className="w-6 h-6 text-sky-500" />, title: "Real-time Tracking", desc: "Pantau status surat secara langsung dari dashboard dengan timeline interaktif." },
            { icon: <ShieldCheck className="w-6 h-6 text-cyan-500" />, title: "Keamanan Arsip", desc: "Penyimpanan dokumen terenkripsi dengan jaminan keutuhan arsip digital." },
            { icon: <Droplets className="w-6 h-6 text-emerald-500" />, title: "Integrasi Sistem", desc: "Terhubung secara seamless dengan berbagai divisi untuk mempercepat persetujuan." }
          ].map((feat, idx) => (
            <div key={idx} className="glass-panel p-6 border-transparent hover:border-cyan-100 transition-colors group cursor-pointer hover:-translate-y-1 transform duration-300">
              <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                {feat.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">{feat.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="py-6 text-center border-t border-slate-200/50 bg-white/50 backdrop-blur-sm z-10 relative">
        <p className="text-sm text-slate-400 font-medium tracking-wide">
          &copy; {new Date().getFullYear()} SIPAS PDAM. Hak Cipta Dilindungi.
        </p>
      </footer>
    </div>
  );
}
