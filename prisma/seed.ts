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
  console.log("Seeding database...");

  const hash = (pw: string) => bcrypt.hashSync(pw, 12);

  // Hapus data lama
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

  const staff = await prisma.user.create({
    data: {
      name: "Budi Santoso",
      email: "staff@pdam.go.id",
      passwordHash: hash("Staff@12345"),
      role: "ADMIN_STAFF",
      divisi: "Administrasi & Umum",
    },
  });

  const admin = await prisma.user.create({
    data: {
      name: "Sari Dewi",
      email: "agendaris@pdam.go.id",
      passwordHash: hash("Agendaris@12345"),
      role: "AGENDARIS",
      divisi: "Sekretariat",
    },
  });

  const direktur = await prisma.user.create({
    data: {
      name: "Ir. H. Ahmad Subagyo",
      email: "direktur@pdam.go.id",
      passwordHash: hash("Direktur@12345"),
      role: "DIREKTUR",
      divisi: "Direksi",
      paraf: "paraf_sample",
      signature: "signature_sample",
    },
  });

  console.log("Users created:", {
    staff: staff.email,
    admin: admin.email,
    direktur: direktur.email,
  });

  const surat = await prisma.suratMasuk.create({
    data: {
      nomorSurat: "001/ADM/PDAM/2025",
      perihal: "Permohonan Pengadaan Peralatan Kantor",
      asalSurat: "Dinas Pekerjaan Umum",
      tanggalSurat: new Date("2025-01-15"),
      currentStatus: "DRAFT",
      createdById: staff.id,
    },
  });

  await prisma.statusTimeline.create({
    data: {
      suratMasukId: surat.id,
      toStatus: "DRAFT",
      changedById: staff.id,
      notes: "Surat masuk dibuat oleh Admin Staff",
    },
  });

  console.log("Sample SuratMasuk created:", surat.nomorSurat);
  console.log("\n📋 Default Credentials:");
  console.log("  Admin Staff → staff@pdam.go.id      / Staff@12345");
  console.log("  Agendaris   → agendaris@pdam.go.id  / Agendaris@12345");
  console.log("  Direktur    → direktur@pdam.go.id   / Direktur@12345");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());