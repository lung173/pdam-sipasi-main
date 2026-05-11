// app/api/notifications/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, successResponse, errorResponse } from "@/lib/auth-helpers";
import { DocumentStatus } from "@prisma/client";

/**
 * @file app/api/notifications/route.ts
 * @description Endpoint untuk mengambil notifikasi aktif berdasarkan role user.
 * Notifikasi dihitung secara dinamis berdasarkan status dokumen yang memerlukan perhatian.
 */

export async function GET(req: NextRequest) {
  return requireAuth(req, async (user) => {
    try {
      const notifications: { id: string; title: string; message: string; link: string; type: string }[] = [];

      // 1. ADMIN_STAFF Notifications
      if (user.role === "ADMIN_STAFF") {
        const docs = await prisma.suratMasuk.findMany({
          where: {
            createdById: user.id,
            currentStatus: { in: ["PERLU_REVISI", "MENUNGGU_PENGAMBILAN_STAFF"] as DocumentStatus[] },
          },
          select: { id: true, nomorSurat: true, currentStatus: true, perihal: true },
        });

        docs.forEach((doc) => {
          if (doc.currentStatus === "PERLU_REVISI") {
            notifications.push({
              id: `revisi-${doc.id}`,
              title: "Perlu Revisi",
              message: `Surat "${doc.perihal}" dikembalikan untuk revisi.`,
              link: `/dashboard/staff/dokumen/${doc.id}`,
              type: "warning",
            });
          } else {
            notifications.push({
              id: `pickup-${doc.id}`,
              title: "Siap Diambil",
              message: `Surat fisik "${doc.perihal}" siap diambil di Agendaris.`,
              link: `/dashboard/staff/dokumen/${doc.id}`,
              type: "info",
            });
          }
        });
      }

      // 2. AGENDARIS Notifications
      if (user.role === "AGENDARIS") {
        const inbox = await prisma.suratMasuk.findMany({
          where: {
            currentStatus: { in: ["MENUNGGU_REVIEW_AGENDARIS", "KEPUTUSAN_DIREKTUR_SELESAI", "MENUNGGU_ARSIP_ADMIN"] as DocumentStatus[] },
          },
          select: { id: true, nomorSurat: true, currentStatus: true, perihal: true },
        });

        inbox.forEach((doc) => {
          if (doc.currentStatus === "MENUNGGU_REVIEW_AGENDARIS") {
            notifications.push({
              id: `review-${doc.id}`,
              title: "Surat Baru",
              message: `Surat baru dari Staff: "${doc.perihal}"`,
              link: `/dashboard/admin/inbox`,
              type: "info",
            });
          } else if (doc.currentStatus === "KEPUTUSAN_DIREKTUR_SELESAI") {
            notifications.push({
              id: `finish-${doc.id}`,
              title: "Keputusan Selesai",
              message: `Direktur telah memutuskan surat "${doc.perihal}".`,
              link: `/dashboard/admin/inbox`,
              type: "success",
            });
          } else {
            notifications.push({
              id: `archive-${doc.id}`,
              title: "Menunggu Arsip",
              message: `Scan final diunggah untuk surat "${doc.perihal}".`,
              link: `/dashboard/admin/inbox`,
              type: "info",
            });
          }
        });
      }

      // 3. DIREKTUR Notifications
      if (user.role === "DIREKTUR") {
        const inbox = await prisma.suratMasuk.findMany({
          where: {
            currentStatus: { in: ["MENUNGGU_KEPUTUSAN_DIREKTUR", "DIPROSES_DIREKTUR"] as DocumentStatus[] },
          },
          select: { id: true, nomorSurat: true, perihal: true },
        });

        inbox.forEach((doc) => {
          notifications.push({
            id: `decision-${doc.id}`,
            title: "Butuh Keputusan",
            message: `Menunggu tanda tangan/disposisi: "${doc.perihal}"`,
            link: `/dashboard/direktur/inbox`,
            type: "urgent",
          });
        });
      }

      return successResponse(notifications);
    } catch (error) {
      console.error("[GET /api/notifications]", error);
      return errorResponse("Gagal mengambil notifikasi.");
    }
  });
}
