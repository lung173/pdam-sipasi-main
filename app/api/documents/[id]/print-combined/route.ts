// app/api/documents/[id]/print-combined/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, props: Params) {
  const params = await props.params;
  return requireAuth(req, async (user) => {
    try {
      const doc = await prisma.suratMasuk.findUnique({
        where: { id: params.id },
        include: {
          files: {
            where: { fileType: "FINAL_SCAN" },
            orderBy: { uploadedAt: "desc" },
            take: 1,
          },
          disposisi: {
            include: { dari: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });

      if (!doc) return new NextResponse("Dokumen tidak ditemukan", { status: 404 });

      // Create new PDF
      const combinedPdf = await PDFDocument.create();
      const fontBold = await combinedPdf.embedFont(StandardFonts.HelveticaBold);
      const fontRegular = await combinedPdf.embedFont(StandardFonts.Helvetica);

      // --- 1. GENERATE DISPOSISI PAGE ---
      const dispPage = combinedPdf.addPage([595.28, 841.89]); // A4
      const { width, height } = dispPage.getSize();
      const margin = 50;

      // Draw border
      dispPage.drawRectangle({
        x: margin,
        y: margin,
        width: width - margin * 2,
        height: height - margin * 2,
        borderWidth: 2,
        borderColor: rgb(0, 0, 0),
      });

      // Header
      dispPage.drawText("PERUSAHAAN UMUM DAERAH AIR MINUM", {
        x: width / 2 - 140,
        y: height - 80,
        size: 12,
        font: fontBold,
      });
      dispPage.drawText("TIRTA MAKMUR KABUPATEN SUKOHARJO", {
        x: width / 2 - 130,
        y: height - 100,
        size: 12,
        font: fontBold,
      });
      dispPage.drawText("LEMBAR DISPOSISI", {
        x: width / 2 - 60,
        y: height - 140,
        size: 16,
        font: fontBold,
      });

      // Horizontal line
      dispPage.drawLine({
        start: { x: margin, y: height - 160 },
        end: { x: width - margin, y: height - 160 },
        thickness: 2,
      });

      // Info rows
      const rowY = height - 190;
      dispPage.drawText(`Tanggal Surat: ${format(new Date(doc.tanggalSurat), "dd MMMM yyyy", { locale: localeId })}`, { x: margin + 20, y: rowY, size: 10, font: fontRegular });
      dispPage.drawText(`No. Agenda: ${doc.nomorAgenda || "-"}`, { x: width / 2 + 20, y: rowY, size: 10, font: fontRegular });
      
      dispPage.drawText(`Asal Surat: ${doc.asalSurat || "-"}`, { x: margin + 20, y: rowY - 20, size: 10, font: fontRegular });
      dispPage.drawText(`Nomor Surat: ${doc.nomorSurat}`, { x: width / 2 + 20, y: rowY - 20, size: 10, font: fontRegular });

      dispPage.drawText(`Perihal: ${doc.perihal}`, { x: margin + 20, y: rowY - 40, size: 10, font: fontRegular });

      // Disposisi logic
      const latestDisp = doc.disposisi[0];
      if (latestDisp) {
        dispPage.drawText("Disposisi Kepada:", { x: margin + 20, y: rowY - 80, size: 10, font: fontBold });
        dispPage.drawText(latestDisp.jabatanKe || "-", { x: margin + 40, y: rowY - 100, size: 10, font: fontRegular });

        dispPage.drawText("Instruksi / Informasi:", { x: margin + 20, y: rowY - 140, size: 10, font: fontBold });
        dispPage.drawText(latestDisp.instruksi || "-", { x: margin + 40, y: rowY - 160, size: 10, font: fontRegular, maxWidth: width - margin * 2 - 80 });

        // Tanda Tangan Direktur di Disposisi
        if (latestDisp.dari.role === "DIREKTUR" && latestDisp.dari.signature) {
          try {
            const sigImgBase64 = latestDisp.dari.signature.split(',')[1] || latestDisp.dari.signature;
            const sigImg = await combinedPdf.embedPng(Buffer.from(sigImgBase64, 'base64'));
            dispPage.drawImage(sigImg, {
              x: width - margin - 150,
              y: margin + 60,
              width: 100,
              height: 50,
            });
          } catch (e) {
            console.error("Gagal embed signature di disposisi", e);
          }
        }
        dispPage.drawText(latestDisp.dari.name, { x: width - margin - 150, y: margin + 40, size: 10, font: fontBold });
      }

      // --- 2. MERGE MAIN DOCUMENT ---
      if (doc.files.length > 0) {
        const file = doc.files[0];
        try {
          // In a real app, you'd fetch from S3/Storage. 
          // Assuming local path for now or absolute URL.
          const response = await fetch(new URL(file.filePath, req.url).href);
          const fileBytes = await response.arrayBuffer();
          const mainPdf = await PDFDocument.load(fileBytes);
          const mainPages = await combinedPdf.copyPages(mainPdf, mainPdf.getPageIndices());
          
          // --- 3. AUTOMATIC SIGNATURE INSIDE LETTER ---
          const director = await prisma.user.findFirst({ where: { role: "DIREKTUR" } });
          if (director && director.signature) {
            const firstPage = mainPages[0];
            const { width: pWidth, height: pHeight } = firstPage.getSize();
            
            // Logic to find name and place signature:
            // Since we can't search text easily, we'll place it in a common area (bottom right)
            // or we could try to use a placeholder.
            // For this implementation, we'll place it near the bottom right.
            try {
              const sigImgBase64 = director.signature.split(',')[1] || director.signature;
              const sigImg = await combinedPdf.embedPng(Buffer.from(sigImgBase64, 'base64'));
              
              // Fallback placement (bottom right)
              firstPage.drawImage(sigImg, {
                x: pWidth - 200,
                y: 100,
                width: 120,
                height: 60,
              });
            } catch (e) {
              console.error("Gagal embed signature di surat utama", e);
            }
          }

          mainPages.forEach((page) => combinedPdf.addPage(page));
        } catch (e) {
          console.error("Gagal memuat file utama", e);
        }
      }

      const pdfBytes = await combinedPdf.save();
      return new NextResponse(Buffer.from(pdfBytes), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="Surat_Gabungan_${doc.nomorSurat}.pdf"`,
        },
      });
    } catch (error) {
      console.error("[GET /api/documents/[id]/print-combined]", error);
      return new NextResponse("Internal Server Error", { status: 500 });
    }
  });
}
