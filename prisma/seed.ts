// prisma/seed.ts
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = `${process.env.DIRECT_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database with complete dummy data...\n");

  const hash = (pw: string) => bcrypt.hashSync(pw, 12);

  // ── Hapus data lama (urutan sesuai dependensi) ──
  await prisma.auditLog.deleteMany();
  await prisma.statusTimeline.deleteMany();
  await prisma.archive.deleteMany();
  await prisma.undanganPenerima.deleteMany();
  await prisma.undangan.deleteMany();
  await prisma.lembarDisposisi.deleteMany();
  await prisma.jadwalDirekturs.deleteMany();
  await prisma.directorDecision.deleteMany();
  await prisma.documentReview.deleteMany();
  await prisma.documentFile.deleteMany();
  await prisma.suratMasuk.deleteMany();
  await prisma.user.deleteMany();
  console.log("✅ Data lama dihapus\n");

  // ═══════════════════════════════════════════
  //  1. USERS (5 user)
  // ═══════════════════════════════════════════
  const staff = await prisma.user.create({
    data: {
      name: "Budi Santoso",
      email: "staff@pdam.go.id",
      passwordHash: hash("Staff@12345"),
      role: "ADMIN_STAFF",
      divisi: "Administrasi & Umum",
      bagian: "Tata Usaha",
    },
  });

  const staff2 = await prisma.user.create({
    data: {
      name: "Rina Marlina",
      email: "staff2@pdam.go.id",
      passwordHash: hash("Staff2@12345"),
      role: "ADMIN_STAFF",
      divisi: "Keuangan",
      bagian: "Akuntansi",
    },
  });

  const agendaris = await prisma.user.create({
    data: {
      name: "Sari Dewi",
      email: "agendaris@pdam.go.id",
      passwordHash: hash("Agendaris@12345"),
      role: "AGENDARIS",
      divisi: "Sekretariat",
      bagian: "Agenda & Arsip",
    },
  });

  const direktur = await prisma.user.create({
    data: {
      name: "Ir. H. Ahmad Subagyo",
      email: "direktur@pdam.go.id",
      passwordHash: hash("Direktur@12345"),
      role: "DIREKTUR",
      divisi: "Direksi",
      paraf: "paraf_direktur_base64",
      signature: "signature_direktur_base64",
    },
  });

  const kabag = await prisma.user.create({
    data: {
      name: "Drs. Hendra Wijaya",
      email: "kabag@pdam.go.id",
      passwordHash: hash("Kabag@12345"),
      role: "KABAG",
      divisi: "Hubungan Langganan",
      bagian: "Pelayanan",
    },
  });

  console.log("✅ 5 Users created");

  // ═══════════════════════════════════════════
  //  2. SURAT MASUK (5 surat)
  // ═══════════════════════════════════════════
  const surat1 = await prisma.suratMasuk.create({
    data: {
      nomorSurat: "001/ADM/PDAM/2025",
      nomorAgenda: "AG-001/2025",
      perihal: "Permohonan Pengadaan Peralatan Kantor",
      deskripsi: "Surat permohonan pengadaan komputer dan printer untuk divisi administrasi",
      tujuan: "Direktur PDAM",
      asalSurat: "Dinas Pekerjaan Umum Kota Malang",
      tanggalSurat: new Date("2025-01-15"),
      currentStatus: "ARSIP_FINAL_TERSIMPAN",
      createdById: staff.id,
      currentHolder: agendaris.id,
      documentType: "SURAT_MASUK",
      category: "PENGADAAN",
    },
  });

  const surat2 = await prisma.suratMasuk.create({
    data: {
      nomorSurat: "002/KEU/PDAM/2025",
      nomorAgenda: "AG-002/2025",
      perihal: "Laporan Audit Keuangan Triwulan I",
      deskripsi: "Laporan hasil audit keuangan triwulan pertama tahun 2025",
      tujuan: "Direktur PDAM",
      asalSurat: "BPK Perwakilan Jawa Timur",
      tanggalSurat: new Date("2025-02-10"),
      currentStatus: "KEPUTUSAN_DIREKTUR_SELESAI",
      createdById: staff2.id,
      currentHolder: direktur.id,
      documentType: "SURAT_MASUK",
      category: "KEUANGAN",
    },
  });

  const surat3 = await prisma.suratMasuk.create({
    data: {
      nomorSurat: "003/HUB/PDAM/2025",
      perihal: "Undangan Rapat Koordinasi Pelayanan Air Bersih",
      deskripsi: "Undangan rapat koordinasi antar instansi terkait pelayanan air bersih",
      tujuan: "Direktur PDAM",
      asalSurat: "Pemerintah Kota Malang",
      tanggalSurat: new Date("2025-03-01"),
      currentStatus: "DIJADWALKAN_KE_DIREKTUR",
      createdById: staff.id,
      currentHolder: agendaris.id,
      documentType: "UNDANGAN",
      category: "UNDANGAN",
    },
  });

  const surat4 = await prisma.suratMasuk.create({
    data: {
      nomorSurat: "004/TEK/PDAM/2025",
      perihal: "Permohonan Perbaikan Jaringan Pipa Distribusi",
      deskripsi: "Laporan kerusakan pipa distribusi di wilayah Lowokwaru",
      tujuan: "Kabag Teknik",
      asalSurat: "Kelurahan Lowokwaru",
      tanggalSurat: new Date("2025-03-15"),
      currentStatus: "MENUNGGU_REVIEW_AGENDARIS",
      createdById: staff.id,
      documentType: "SURAT_MASUK",
      category: "TEKNIK",
    },
  });

  const surat5 = await prisma.suratMasuk.create({
    data: {
      nomorSurat: "005/SDM/PDAM/2025",
      perihal: "Pengajuan Cuti Tahunan Pegawai",
      asalSurat: "Internal - Divisi SDM",
      tanggalSurat: new Date("2025-04-01"),
      currentStatus: "DRAFT",
      createdById: staff2.id,
      documentType: "SURAT_MASUK",
      category: "KEPEGAWAIAN",
    },
  });

  console.log("✅ 5 Surat Masuk created");

  // Surat Tugas
  const surat6 = await prisma.suratMasuk.create({
    data: {
      nomorSurat: "006/ST/PDAM/2025",
      perihal: "Surat Tugas Pelatihan Manajemen Air",
      deskripsi: "Penugasan pegawai mengikuti pelatihan di Surabaya",
      tujuan: "Budi Santoso",
      asalSurat: "Internal - Sekretariat",
      tanggalSurat: new Date("2025-04-10"),
      currentStatus: "MENUNGGU_KEPUTUSAN_DIREKTUR",
      createdById: agendaris.id,
      currentHolder: direktur.id,
      documentType: "SURAT_TUGAS",
      category: "KEPEGAWAIAN",
    },
  });

  // Surat Keluar
  const surat7 = await prisma.suratMasuk.create({
    data: {
      nomorSurat: "007/SK/PDAM/2025",
      perihal: "Balasan Permohonan Kerjasama Penyediaan Air Bersih",
      deskripsi: "Surat keluar ke Pemkot perihal kerjasama air bersih",
      tujuan: "Pemerintah Kota Malang",
      asalSurat: "PDAM Kota Malang",
      tanggalSurat: new Date("2025-04-15"),
      currentStatus: "MENUNGGU_REVIEW_AGENDARIS",
      createdById: agendaris.id,
      documentType: "SURAT_KELUAR",
      category: "KERJASAMA",
    },
  });

  // SK Direktur
  const surat8 = await prisma.suratMasuk.create({
    data: {
      nomorSurat: "008/SKD/PDAM/2025",
      perihal: "SK Pengangkatan Kepala Unit Pelayanan",
      deskripsi: "Surat keputusan pengangkatan jabatan",
      tujuan: "Seluruh Pegawai PDAM",
      tanggalSurat: new Date("2025-05-01"),
      currentStatus: "DRAFT",
      createdById: agendaris.id,
      documentType: "SK_DIREKTUR",
      category: "KEPEGAWAIAN",
    },
  });

  // Perjanjian
  const surat9 = await prisma.suratMasuk.create({
    data: {
      nomorSurat: "009/PJ/PDAM/2025",
      perihal: "Perjanjian Kerjasama Pengadaan Pipa PVC",
      deskripsi: "Kontrak pengadaan pipa PVC dengan CV Baja Mandiri",
      tujuan: "CV Baja Mandiri",
      tanggalSurat: new Date("2025-05-05"),
      currentStatus: "DIJADWALKAN_KE_DIREKTUR",
      createdById: agendaris.id,
      currentHolder: agendaris.id,
      documentType: "PERJANJIAN",
      category: "PENGADAAN",
    },
  });

  // Peraturan Direktur
  const surat10 = await prisma.suratMasuk.create({
    data: {
      nomorSurat: "010/PD/PDAM/2025",
      perihal: "Peraturan Jam Kerja dan Lembur Pegawai",
      deskripsi: "Penetapan aturan baru jam kerja efektif",
      tujuan: "Seluruh Pegawai PDAM",
      tanggalSurat: new Date("2025-05-10"),
      currentStatus: "DRAFT",
      createdById: direktur.id,
      documentType: "PERATURAN_DIREKTUR",
      category: "KEPEGAWAIAN",
    },
  });

  // Undangan External
  const surat11 = await prisma.suratMasuk.create({
    data: {
      nomorSurat: "011/UND-EXT/PDAM/2025",
      perihal: "Undangan Seminar Nasional Pengelolaan Air",
      deskripsi: "Undangan dari Kementerian PUPR untuk seminar nasional",
      tujuan: "Direktur PDAM",
      asalSurat: "Kementerian PUPR Jakarta",
      tanggalSurat: new Date("2025-05-15"),
      currentStatus: "MENUNGGU_KEPUTUSAN_DIREKTUR",
      createdById: agendaris.id,
      currentHolder: direktur.id,
      documentType: "UNDANGAN",
      category: "UNDANGAN",
    },
  });

  // Surat Keluar ke Instansi
  const surat12 = await prisma.suratMasuk.create({
    data: {
      nomorSurat: "012/SK-EXT/PDAM/2025",
      perihal: "Permohonan Izin Pemasangan Pipa Baru",
      deskripsi: "Surat ke Dinas PU untuk izin galian jalan pemasangan pipa",
      tujuan: "Dinas PU Kota Malang",
      tanggalSurat: new Date("2025-05-20"),
      currentStatus: "ARSIP_FINAL_TERSIMPAN",
      createdById: agendaris.id,
      currentHolder: agendaris.id,
      documentType: "SURAT_KELUAR",
      category: "PERIZINAN",
    },
  });

  console.log("✅ 12 Dokumen created (7 jenis)");

  // ═══════════════════════════════════════════
  //  3. DOCUMENT FILES (6 file)
  // ═══════════════════════════════════════════
  await prisma.documentFile.createMany({
    data: [
      {
        suratMasukId: surat1.id,
        fileType: "SCAN_MASUK",
        fileName: "scan_surat_001.pdf",
        filePath: "/uploads/2025/01/scan_surat_001.pdf",
        fileSize: 1024000,
        mimeType: "application/pdf",
        uploadedById: staff.id,
      },
      {
        suratMasukId: surat1.id,
        fileType: "FINAL_SCAN",
        fileName: "final_surat_001.pdf",
        filePath: "/uploads/2025/01/final_surat_001.pdf",
        fileSize: 2048000,
        mimeType: "application/pdf",
        uploadedById: agendaris.id,
      },
      {
        suratMasukId: surat2.id,
        fileType: "SCAN_MASUK",
        fileName: "scan_audit_002.pdf",
        filePath: "/uploads/2025/02/scan_audit_002.pdf",
        fileSize: 3500000,
        mimeType: "application/pdf",
        uploadedById: staff2.id,
      },
      {
        suratMasukId: surat2.id,
        fileType: "ATTACHMENT",
        fileName: "lampiran_audit.xlsx",
        filePath: "/uploads/2025/02/lampiran_audit.xlsx",
        fileSize: 512000,
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        uploadedById: staff2.id,
      },
      {
        suratMasukId: surat3.id,
        fileType: "SCAN_MASUK",
        fileName: "undangan_rapat_003.pdf",
        filePath: "/uploads/2025/03/undangan_rapat_003.pdf",
        fileSize: 750000,
        mimeType: "application/pdf",
        uploadedById: staff.id,
      },
      {
        suratMasukId: surat4.id,
        fileType: "DRAFT",
        fileName: "draft_perbaikan_pipa.docx",
        filePath: "/uploads/2025/03/draft_perbaikan_pipa.docx",
        fileSize: 256000,
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        uploadedById: staff.id,
      },
    ],
  });
  console.log("✅ 6 Document Files created");

  // ═══════════════════════════════════════════
  //  4. DOCUMENT REVIEWS (4 review)
  // ═══════════════════════════════════════════
  await prisma.documentReview.createMany({
    data: [
      {
        suratMasukId: surat1.id,
        reviewedById: agendaris.id,
        reviewNote: "Surat lengkap, diteruskan ke Direktur",
        reviewStatus: "DITERUSKAN",
        reviewedAt: new Date("2025-01-16T09:00:00"),
      },
      {
        suratMasukId: surat2.id,
        reviewedById: agendaris.id,
        reviewNote: "Dokumen audit sudah sesuai, diteruskan",
        reviewStatus: "DITERUSKAN",
        reviewedAt: new Date("2025-02-11T10:30:00"),
      },
      {
        suratMasukId: surat3.id,
        reviewedById: agendaris.id,
        reviewNote: "Undangan diteruskan ke Direktur untuk dijadwalkan",
        reviewStatus: "DITERUSKAN",
        reviewedAt: new Date("2025-03-02T08:00:00"),
      },
      {
        suratMasukId: surat4.id,
        reviewedById: agendaris.id,
        reviewNote: "Lampiran belum lengkap, dikembalikan ke staff",
        reviewStatus: "DIKEMBALIKAN",
        reviewedAt: new Date("2025-03-16T14:00:00"),
      },
    ],
  });
  console.log("✅ 4 Document Reviews created");

  // ═══════════════════════════════════════════
  //  5. JADWAL DIREKTURS (3 jadwal)
  // ═══════════════════════════════════════════
  await prisma.jadwalDirekturs.createMany({
    data: [
      {
        suratMasukId: surat1.id,
        createdById: agendaris.id,
        jadwalKirim: new Date("2025-01-17T08:00:00"),
        isUrgen: false,
        isSent: true,
        sentAt: new Date("2025-01-17T08:15:00"),
        catatan: "Surat pengadaan rutin",
      },
      {
        suratMasukId: surat2.id,
        createdById: agendaris.id,
        jadwalKirim: new Date("2025-02-12T09:00:00"),
        isUrgen: true,
        isSent: true,
        sentAt: new Date("2025-02-12T09:05:00"),
        catatan: "Laporan audit - prioritas tinggi",
      },
      {
        suratMasukId: surat3.id,
        createdById: agendaris.id,
        jadwalKirim: new Date("2025-03-03T10:00:00"),
        isUrgen: false,
        isSent: false,
        catatan: "Menunggu jadwal Direktur kosong",
      },
    ],
  });
  console.log("✅ 3 Jadwal Direkturs created");

  // ═══════════════════════════════════════════
  //  6. DIRECTOR DECISIONS (3 keputusan)
  // ═══════════════════════════════════════════
  await prisma.directorDecision.createMany({
    data: [
      {
        suratMasukId: surat1.id,
        directorId: direktur.id,
        decisionType: "DISETUJUI",
        decisionNote: "Disetujui. Segera proses pengadaan sesuai anggaran.",
        tempat: "Kantor PDAM Kota Malang",
        tanggalTandaTangan: new Date("2025-01-18T10:00:00"),
        parafDirektur: "paraf_base64_sample_1",
      },
      {
        suratMasukId: surat2.id,
        directorId: direktur.id,
        decisionType: "DISPOSISI",
        decisionNote: "Disposisi ke Kabag Keuangan untuk tindak lanjut.",
        tempat: "Kantor PDAM Kota Malang",
        tanggalTandaTangan: new Date("2025-02-13T11:00:00"),
        parafDirektur: "paraf_base64_sample_2",
      },
      {
        suratMasukId: surat2.id,
        directorId: direktur.id,
        decisionType: "REVISI",
        decisionNote: "Perlu revisi pada bagian rekomendasi halaman 5.",
        tempat: "Kantor PDAM Kota Malang",
        tanggalTandaTangan: new Date("2025-02-14T09:00:00"),
        parafDirektur: "paraf_base64_sample_3",
      },
    ],
  });
  console.log("✅ 3 Director Decisions created");

  // ═══════════════════════════════════════════
  //  7. LEMBAR DISPOSISI (3 disposisi)
  // ═══════════════════════════════════════════
  await prisma.lembarDisposisi.createMany({
    data: [
      {
        suratMasukId: surat1.id,
        dariId: direktur.id,
        keId: kabag.id,
        jabatanKe: "Kabag Hubungan Langganan",
        instruksi: "Segera koordinasikan pengadaan peralatan dengan vendor terpilih",
        keterangan: "Prioritas tinggi - deadline akhir bulan",
        tempat: "Kantor PDAM Kota Malang",
        tanggalTandaTangan: new Date("2025-01-18T10:30:00"),
        parafDariId: "paraf_direktur_disposisi_1",
      },
      {
        suratMasukId: surat2.id,
        dariId: direktur.id,
        keId: staff2.id,
        jabatanKe: "Staff Keuangan",
        instruksi: "Tindak lanjuti temuan audit, siapkan laporan balasan",
        keterangan: "Deadline 2 minggu",
        tempat: "Kantor PDAM Kota Malang",
        tanggalTandaTangan: new Date("2025-02-13T11:30:00"),
        parafDariId: "paraf_direktur_disposisi_2",
      },
      {
        suratMasukId: surat2.id,
        dariId: agendaris.id,
        keId: staff2.id,
        jabatanKe: "Staff Keuangan",
        instruksi: "Lengkapi dokumen pendukung audit",
        keterangan: "Sesuai arahan Direktur",
      },
    ],
  });
  console.log("✅ 3 Lembar Disposisi created");

  // ═══════════════════════════════════════════
  //  8. UNDANGAN (2 undangan)
  // ═══════════════════════════════════════════
  const undangan1 = await prisma.undangan.create({
    data: {
      suratMasukId: surat3.id,
      hari: "Senin",
      tanggal: new Date("2025-03-10T09:00:00"),
      jam: "09:00",
      tempat: "Aula Balai Kota Malang",
      media: "OFFLINE",
      dresscode: "Batik Formal",
      catatanLain: "Harap membawa data produksi air bersih 3 bulan terakhir",
      deadline: new Date("2025-03-08T17:00:00"),
    },
  });

  const undangan2 = await prisma.undangan.create({
    data: {
      suratMasukId: surat4.id,
      hari: "Rabu",
      tanggal: new Date("2025-03-20T14:00:00"),
      jam: "14:00",
      tempat: "Meeting Room PDAM via Zoom",
      media: "ONLINE",
      catatanLain: "Link Zoom akan dikirim H-1",
      deadline: new Date("2025-03-19T12:00:00"),
    },
  });
  console.log("✅ 2 Undangan created");

  // ═══════════════════════════════════════════
  //  9. UNDANGAN PENERIMA (5 penerima)
  // ═══════════════════════════════════════════
  await prisma.undanganPenerima.createMany({
    data: [
      { undanganId: undangan1.id, userId: direktur.id, sudahBaca: true },
      { undanganId: undangan1.id, userId: kabag.id, sudahBaca: true },
      { undanganId: undangan1.id, userId: agendaris.id, sudahBaca: false },
      { undanganId: undangan2.id, userId: direktur.id, sudahBaca: false },
      { undanganId: undangan2.id, userId: staff.id, sudahBaca: false },
    ],
  });
  console.log("✅ 5 Undangan Penerima created");

  // ═══════════════════════════════════════════
  //  10. ARCHIVES (1 arsip)
  // ═══════════════════════════════════════════
  await prisma.archive.create({
    data: {
      suratMasukId: surat1.id,
      archivedById: agendaris.id,
      serverLocation: "/arsip/2025/01/001_ADM_PDAM_2025",
      bulan: 1,
      tahun: 2025,
      notes: "Arsip surat pengadaan peralatan - proses selesai",
    },
  });
  console.log("✅ 1 Archive created");

  // ═══════════════════════════════════════════
  //  11. STATUS TIMELINE (12 timeline entries)
  // ═══════════════════════════════════════════
  const timelineData = [
    // Surat 1 - full flow
    { suratMasukId: surat1.id, fromStatus: null, toStatus: "DRAFT" as const, changedById: staff.id, notes: "Surat masuk dibuat", createdAt: new Date("2025-01-15T08:00:00") },
    { suratMasukId: surat1.id, fromStatus: "DRAFT" as const, toStatus: "MENUNGGU_REVIEW_AGENDARIS" as const, changedById: staff.id, notes: "Dikirim ke Agendaris", createdAt: new Date("2025-01-15T08:30:00") },
    { suratMasukId: surat1.id, fromStatus: "MENUNGGU_REVIEW_AGENDARIS" as const, toStatus: "DIJADWALKAN_KE_DIREKTUR" as const, changedById: agendaris.id, notes: "Review selesai, dijadwalkan", createdAt: new Date("2025-01-16T09:00:00") },
    { suratMasukId: surat1.id, fromStatus: "DIJADWALKAN_KE_DIREKTUR" as const, toStatus: "MENUNGGU_KEPUTUSAN_DIREKTUR" as const, changedById: agendaris.id, notes: "Dikirim ke Direktur", createdAt: new Date("2025-01-17T08:15:00") },
    { suratMasukId: surat1.id, fromStatus: "MENUNGGU_KEPUTUSAN_DIREKTUR" as const, toStatus: "KEPUTUSAN_DIREKTUR_SELESAI" as const, changedById: direktur.id, notes: "Disetujui Direktur", createdAt: new Date("2025-01-18T10:00:00") },
    { suratMasukId: surat1.id, fromStatus: "KEPUTUSAN_DIREKTUR_SELESAI" as const, toStatus: "ARSIP_FINAL_TERSIMPAN" as const, changedById: agendaris.id, notes: "Diarsipkan", createdAt: new Date("2025-01-20T09:00:00") },
    // Surat 2
    { suratMasukId: surat2.id, fromStatus: null, toStatus: "DRAFT" as const, changedById: staff2.id, notes: "Surat audit dibuat", createdAt: new Date("2025-02-10T08:00:00") },
    { suratMasukId: surat2.id, fromStatus: "DRAFT" as const, toStatus: "MENUNGGU_REVIEW_AGENDARIS" as const, changedById: staff2.id, notes: "Dikirim ke Agendaris", createdAt: new Date("2025-02-10T10:00:00") },
    { suratMasukId: surat2.id, fromStatus: "MENUNGGU_REVIEW_AGENDARIS" as const, toStatus: "KEPUTUSAN_DIREKTUR_SELESAI" as const, changedById: direktur.id, notes: "Keputusan disposisi", createdAt: new Date("2025-02-13T11:00:00") },
    // Surat 3
    { suratMasukId: surat3.id, fromStatus: null, toStatus: "DRAFT" as const, changedById: staff.id, notes: "Undangan rapat dibuat", createdAt: new Date("2025-03-01T08:00:00") },
    { suratMasukId: surat3.id, fromStatus: "DRAFT" as const, toStatus: "DIJADWALKAN_KE_DIREKTUR" as const, changedById: agendaris.id, notes: "Dijadwalkan kirim", createdAt: new Date("2025-03-02T08:00:00") },
    // Surat 4
    { suratMasukId: surat4.id, fromStatus: null, toStatus: "MENUNGGU_REVIEW_AGENDARIS" as const, changedById: staff.id, notes: "Surat perbaikan masuk", createdAt: new Date("2025-03-15T08:00:00") },
  ];

  for (const t of timelineData) {
    await prisma.statusTimeline.create({ data: t });
  }
  console.log("✅ 12 Status Timeline entries created");

  // ═══════════════════════════════════════════
  //  12. AUDIT LOGS (8 log entries)
  // ═══════════════════════════════════════════
  await prisma.auditLog.createMany({
    data: [
      { userId: staff.id, suratMasukId: surat1.id, action: "CREATE_SURAT", description: "Membuat surat masuk baru: 001/ADM/PDAM/2025", ipAddress: "192.168.1.10", metadata: { browser: "Chrome", os: "Windows" } },
      { userId: staff.id, suratMasukId: surat1.id, action: "UPLOAD_FILE", description: "Upload scan surat 001", ipAddress: "192.168.1.10" },
      { userId: agendaris.id, suratMasukId: surat1.id, action: "REVIEW_SURAT", description: "Review dan teruskan surat 001 ke Direktur", ipAddress: "192.168.1.20" },
      { userId: direktur.id, suratMasukId: surat1.id, action: "DECISION_MADE", description: "Surat 001 disetujui", ipAddress: "192.168.1.1", metadata: { decisionType: "DISETUJUI" } },
      { userId: agendaris.id, suratMasukId: surat1.id, action: "ARCHIVE_SURAT", description: "Surat 001 diarsipkan", ipAddress: "192.168.1.20" },
      { userId: staff2.id, suratMasukId: surat2.id, action: "CREATE_SURAT", description: "Membuat surat audit: 002/KEU/PDAM/2025", ipAddress: "192.168.1.15" },
      { userId: direktur.id, suratMasukId: surat2.id, action: "DECISION_MADE", description: "Disposisi surat audit ke Kabag", ipAddress: "192.168.1.1", metadata: { decisionType: "DISPOSISI" } },
      { userId: staff.id, action: "LOGIN", description: "User login berhasil", ipAddress: "192.168.1.10", metadata: { method: "credentials" } },
    ],
  });
  console.log("✅ 8 Audit Logs created");

  // ═══════════════════════════════════════════
  //  SUMMARY
  // ═══════════════════════════════════════════
  console.log("\n🎉 Seeding complete!\n");
  console.log("📊 Data Summary:");
  console.log("  Users              : 5");
  console.log("  Surat Masuk        : 5");
  console.log("  Document Files     : 6");
  console.log("  Document Reviews   : 4");
  console.log("  Jadwal Direkturs   : 3");
  console.log("  Director Decisions : 3");
  console.log("  Lembar Disposisi   : 3");
  console.log("  Undangan           : 2");
  console.log("  Undangan Penerima  : 5");
  console.log("  Archives           : 1");
  console.log("  Status Timeline    : 12");
  console.log("  Audit Logs         : 8");
  console.log("\n📋 Default Credentials:");
  console.log("  Admin Staff 1 → staff@pdam.go.id       / Staff@12345");
  console.log("  Admin Staff 2 → staff2@pdam.go.id      / Staff2@12345");
  console.log("  Agendaris     → agendaris@pdam.go.id   / Agendaris@12345");
  console.log("  Direktur      → direktur@pdam.go.id    / Direktur@12345");
  console.log("  Kabag         → kabag@pdam.go.id       / Kabag@12345");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());