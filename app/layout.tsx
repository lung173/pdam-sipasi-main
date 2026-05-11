/**
 * @file app/layout.tsx
 * @description Layout utama (Root Layout) untuk seluruh aplikasi.
 * Mengatur konfigurasi font, metadata SEO, integrasi toaster notifikasi, 
 * dan membungkus aplikasi dengan Providers (NextAuth & Context).
 */
// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SIPAS PDAM — Sistem Informasi Pengelolaan Arsip Surat",
  description: "Sistem digitalisasi alur surat dan dokumen internal PDAM berbasis website",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: { fontSize: "16px", maxWidth: "450px" },
              success: { iconTheme: { primary: "#16a34a", secondary: "#fff" } },
              error: { iconTheme: { primary: "#dc2626", secondary: "#fff" } },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
