import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CheckCircle, ShieldCheck, XCircle } from "lucide-react";

type Params = { params: Promise<{ id: string }> };

export default async function VerifyDocumentPage(props: Params) {
  const params = await props.params;
  const docId = params.id;

  const doc = await prisma.suratMasuk.findUnique({
    where: { id: docId },
    include: {
      createdBy: { select: { name: true, divisi: true } },
      decisions: {
        include: { director: { select: { name: true } } },
        where: { decisionType: "DISETUJUI" }, // Cari keputusan tanda tangan
        orderBy: { decidedAt: "desc" },
        take: 1
      }
    }
  });

  if (!doc) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <XCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dokumen Tidak Ditemukan</h1>
        <p className="text-gray-600">Dokumen tersebut tidak terdaftar di sistem persuratan resmi PDAM.</p>
      </div>
    );
  }

  const approvedDecision = doc.decisions[0];

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 p-6 text-center text-white">
          <ShieldCheck className="w-16 h-16 mx-auto mb-3 text-blue-100" />
          <h1 className="text-2xl font-bold">Verifikasi e-Signature</h1>
          <p className="text-blue-100 text-sm mt-1">Sistem Persuratan PDAM</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {approvedDecision ? (
            <div className="flex items-center gap-3 bg-green-50 p-4 rounded-xl border border-green-200">
              <CheckCircle className="w-8 h-8 text-green-600 shrink-0" />
              <div>
                <p className="font-semibold text-green-900">Dokumen Sah & Resmi</p>
                <p className="text-xs text-green-700">Telah disetujui secara digital.</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-yellow-50 p-4 rounded-xl border border-yellow-200">
              <XCircle className="w-8 h-8 text-yellow-600 shrink-0" />
              <div>
                <p className="font-semibold text-yellow-900">Belum Disetujui</p>
                <p className="text-xs text-yellow-700">Dokumen ini belum mendapatkan pengesahan akhir.</p>
              </div>
            </div>
          )}

          <div className="space-y-4 text-sm">
            <div>
              <label className="text-xs text-gray-500 font-medium uppercase tracking-wider">Perihal Dokumen</label>
              <p className="font-semibold text-gray-900 text-lg leading-snug">{doc.perihal}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Nomor Surat</label>
                <p className="font-medium text-gray-900">{doc.nomorSurat}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Tanggal Surat</label>
                <p className="font-medium text-gray-900">
                  {format(new Date(doc.tanggalSurat), "dd MMMM yyyy", { locale: localeId })}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <label className="text-xs text-gray-500 block mb-1">Pengirim / Staff</label>
              <p className="font-medium text-gray-900">{doc.createdBy.name} <span className="text-gray-500 font-normal">({doc.createdBy.divisi})</span></p>
            </div>

            {approvedDecision && (
              <div className="border-t border-gray-100 pt-4 bg-blue-50/50 p-3 rounded-lg -mx-3 mt-4">
                <label className="text-xs text-blue-800 block mb-1 font-semibold">Tanda Tangan Digital Oleh</label>
                <p className="font-bold text-blue-900 text-lg">{approvedDecision.director.name}</p>
                <p className="text-xs text-blue-700 mt-1">
                  Disahkan pada: {format(new Date(approvedDecision.decidedAt), "dd MMMM yyyy HH:mm:ss", { locale: localeId })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 text-center text-xs text-gray-400">
          ID Referensi: {doc.id}
        </div>
      </div>
    </div>
  );
}
