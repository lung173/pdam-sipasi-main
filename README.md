# SIPAS PDAM (Sistem Informasi Alur Surat PDAM)

Sistem Informasi Manajemen Surat berbasis web yang dirancang khusus untuk mendigitalisasi proses administrasi dan persuratan di lingkungan PDAM. Aplikasi ini menggunakan arsitektur modern untuk memastikan proses persuratan berjalan dengan efisien, dengan fitur andalan seperti pelacakan status dokumen secara real-time, manajemen disposisi, serta tanda tangan digital menggunakan QR Code (Barcode).

## 🚀 Fitur Utama
1. **Multi-Role Access**: Mendukung 3 peran utama secara dinamis (**Direktur, Agendaris, dan Admin Staff**) dengan fungsi antarmuka spesifik.
2. **Manajemen Surat Masuk & Keluar**: Pencatatan metadata surat, fitur unggah file lampiran (berkapasitas besar), hingga proses pengarsipan.
3. **Tracking Status Dokumen**: Memantau pergerakan dokumen secara visual dari status `Draft` hingga `Arsip Final Tersimpan`.
4. **Sistem Review & Disposisi**: Meneruskan surat untuk direview (Agendaris ke Direktur), hingga menerbitkan lembar disposisi / arahan kerja (Direktur ke Staff).
5. **Tanda Tangan Digital (QR Code)**: Pengesahan dokumen PDF secara otomatis. Direktur cukup menekan tombol "Setujui", dan sistem akan menempelkan Barcode / Paraf QR Code ke dalam PDF secara utuh beserta halaman verifikasi publik.
6. **Manajemen Jadwal & Undangan**: Fitur undangan digital lengkap dengan status baca penerima rapat.

## 💻 Tech Stack (Teknologi yang Digunakan)
- **Frontend**: Next.js (React), Tailwind CSS, Lucide Icons, React Hook Form
- **Backend**: Next.js API Routes (App Router)
- **Autentikasi**: NextAuth.js
- **Database**: PostgreSQL (Via Supabase)
- **ORM**: Prisma Client v7 (Menggunakan Prisma Adapter PG untuk *Connection Pooling*)
- **Utility**: `pdf-lib` (Manipulasi File PDF) & `qrcode` (Pembuatan Barcode)

---

## 🛠️ Langkah-Langkah Instalasi & Menjalankan Projek

Ikuti panduan langkah demi langkah di bawah ini untuk menjalankan projek di komputer lokal Anda:

### 1. Kebutuhan Sistem (Prerequisites)
Pastikan komputer Anda sudah terinstal perangkat lunak berikut:
- [Node.js](https://nodejs.org/en/) (Disarankan versi 18 atau 20 LTS)
- Akun [Supabase](https://supabase.com/) aktif untuk layanan database PostgreSQL gratis.

### 2. Kloning dan Install Dependensi
Buka terminal / command prompt, arahkan ke folder projek, lalu jalankan perintah instalasi Node Package Manager (NPM):
```bash
npm install
```

### 3. Konfigurasi Variabel Lingkungan (Environment)
Aplikasi membutuhkan koneksi ke database. Buat file bernama `.env` di direktori paling luar (root), kemudian salin kode berikut dan isi sesuai kredensial database Anda (Anda bisa mencontoh file `.env.local`):

```env
# URL koneksi Supabase menggunakan Connection Pooling (port 6543)
DATABASE_URL="postgresql://[USER]:[PASSWORD]@[HOST]:6543/postgres?pgbouncer=true"

# URL koneksi langsung untuk Migrasi Schema (port 5432)
DIRECT_URL="postgresql://[USER]:[PASSWORD]@[HOST]:5432/postgres"

# Kunci rahasia untuk sistem Login NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="koderahasia_bebas_diisi_apa_saja"

# Informasi Aplikasi Dasar
NEXT_PUBLIC_APP_NAME="SIPAS PDAM"
NEXT_PUBLIC_APP_VERSION="1.0.0"
```
> **⚠️ PENTING:** 
> Jika password database Anda memiliki karakter spesial (contoh: `@`, `#`, `?`), pastikan untuk melakukan URL-Encode. Sebagai contoh, karakter `@` diganti dengan `%40`.

### 4. Setup Database (Prisma)
Setelah `.env` terisi, Anda perlu membuat tabel-tabel di database dan membuat Prisma Client untuk menyambungkannya dengan kode aplikasi:

```bash
# 1. Melakukan generate struktur Prisma Client (Wajib setiap kali merubah schema)
npm run db:generate

# 2. Push / Migrasi struktur tabel ke Database Supabase
npm run db:migrate
```
*(Opsional: Jika Anda ingin menambahkan data akun awal, jalankan perintah `npm run db:seed`)*

### 5. Menjalankan Server Aplikasi
Setelah konfigurasi dan database siap, jalankan aplikasi di mode *development*:
```bash
npm run dev
```

Selamat! Aplikasi sudah berjalan. Buka browser kesayangan Anda dan akses ke:
👉 **[http://localhost:3000](http://localhost:3000)**

---
**Catatan Penting Pengembang:**
- File PDF dan gambar unggahan akan disimpan sementara di direktori `public/uploads`.
- Konfigurasi `lib/prisma.ts` sudah disesuaikan secara khusus agar tidak bentrokan dengan limitasi *connection pool* bawaan ketika menggunakan Supabase.
