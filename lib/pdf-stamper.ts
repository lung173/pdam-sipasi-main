import { PDFDocument, rgb } from "pdf-lib";
import QRCode from "qrcode";
import fs from "fs/promises";

interface StampOptions {
  docId: string;
  pdfBuffer: Buffer;
  baseUrl: string; // ex: http://localhost:3000
}

export async function stampQRCode({ docId, pdfBuffer, baseUrl }: StampOptions): Promise<Uint8Array> {
  // 1. Generate QR Code Buffer (PNG)
  const validationUrl = `${baseUrl}/verify/${docId}`;
  
  // QRCode.toBuffer returns a Buffer of the PNG image
  const qrImageBuffer = await QRCode.toBuffer(validationUrl, {
    type: "png",
    margin: 1,
    width: 250, // High res for PDF
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });

  // 2. Load the original PDF
  const pdfDoc = await PDFDocument.load(pdfBuffer);

  // 3. Embed the QR Code image
  const qrImage = await pdfDoc.embedPng(qrImageBuffer);
  
  // 4. Get the last page to stamp on
  const pages = pdfDoc.getPages();
  const lastPage = pages[pages.length - 1];

  // 5. Calculate position (Bottom Right)
  const { width, height } = lastPage.getSize();
  
  const qrDims = qrImage.scale(0.35); // Scale down 250px to a reasonable size on A4
  
  // Position it a bit off the edges (e.g. 50px from right, 50px from bottom)
  const marginX = 50;
  const marginY = 50;
  
  const xPos = width - qrDims.width - marginX;
  const yPos = marginY;

  // 6. Draw the QR code
  lastPage.drawImage(qrImage, {
    x: xPos,
    y: yPos,
    width: qrDims.width,
    height: qrDims.height,
  });

  // Optional: Add a tiny text label below it
  // lastPage.drawText("Sah - e-Signature", {
  //   x: xPos,
  //   y: yPos - 12,
  //   size: 8,
  //   color: rgb(0, 0, 0),
  // });

  // 7. Serialize and return as Uint8Array
  return await pdfDoc.save();
}
