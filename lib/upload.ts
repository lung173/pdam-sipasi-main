/**
 * @file lib/upload.ts
 * @description Modul untuk menangani validasi dan penyimpanan file upload.
 * Mendukung pembatasan tipe file (PDF, JPG, PNG) dan ukuran maksimum (20MB), 
 * serta menghasilkan nama file unik untuk penyimpanan di folder public/uploads.
 */
// lib/upload.ts
import path from "path";
import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";

const ALLOWED_MIME = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
];

const MAX_SIZE_MB = 20;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export interface UploadResult {
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
}

export function validateFile(
  mimeType: string,
  fileSize: number
): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME.includes(mimeType)) {
    return {
      valid: false,
      error: `Tipe file tidak diizinkan. Hanya PDF, JPG, PNG. (${mimeType})`,
    };
  }
  if (fileSize > MAX_SIZE_BYTES) {
    return {
      valid: false,
      error: `Ukuran file melebihi batas ${MAX_SIZE_MB}MB.`,
    };
  }
  return { valid: true };
}

export async function saveUploadedFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  subDir = "documents"
): Promise<UploadResult> {
  const ext = path.extname(originalName) || mimeTypeToExt(mimeType);
  const uniqueName = `${uuidv4()}${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", subDir);

  await fs.mkdir(uploadDir, { recursive: true });

  const fullPath = path.join(uploadDir, uniqueName);
  await fs.writeFile(fullPath, buffer);

  return {
    fileName: originalName,
    filePath: `/uploads/${subDir}/${uniqueName}`,
    fileSize: buffer.length,
    mimeType,
  };
}

function mimeTypeToExt(mime: string): string {
  const map: Record<string, string> = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
  };
  return map[mime] ?? ".bin";
}
