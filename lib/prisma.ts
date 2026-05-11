/**
 * @file lib/prisma.ts
 * @description Konfigurasi dan inisialisasi Prisma Client.
 * Mengelola koneksi ke database PostgreSQL (Supabase) menggunakan pooling 
 * untuk efisiensi koneksi di lingkungan serverless/edge.
 */
// lib/prisma.ts
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const fallbackUrl = "postgresql://postgres.gjbxkpknswknodxecxvj:pdamsukoharjoDB2024@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true";
const envUrl = process.env.DATABASE_URL;

// If envUrl is missing or seems to be a placeholder (like "base"), use the fallback from .env
const connectionString = (envUrl && envUrl.includes("supabase.com")) ? envUrl : fallbackUrl;

const pool = new Pool({ 
  connectionString,
  max: 3,                          // Jaga dari limit free tier Supabase (max ~20)
  connectionTimeoutMillis: 15000,  // 15 detik (naik dari 5 detik)
  idleTimeoutMillis: 30000,        // Tutup koneksi idle setelah 30 detik
  ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
