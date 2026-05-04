import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { PrintButton } from "@/components/documents/PrintButton";

type Params = { params: Promise<{ id: string }> };

export default async function CetakDisposisi(props: Params) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "AGENDARIS") redirect("/dashboard");

  const doc = await prisma.suratMasuk.findUnique({
    where: { id: params.id },
    include: {
      disposisi: {
        include: { dari: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!doc) notFound();

  const latestDisposisi = (doc as typeof doc & { disposisi?: { id: string; jabatanKe: string | null; instruksi: string | null; keterangan: string | null; tanggalTandaTangan: Date | null; dari: { name: string } }[] }).disposisi?.[0] ?? null;

  return (
    <div className="p-8 max-w-[21cm] mx-auto bg-white min-h-[29.7cm] text-black">
      {/* Tombol Print (Sembunyi saat dicetak) */}
      <div className="mb-8 flex justify-end print:hidden">
        <PrintButton />
      </div>

      <div className="border-[3px] border-black text-sm">
        {/* Header */}
        <div className="border-b-[3px] border-black p-4 text-center">
          <h1 className="text-lg font-bold uppercase tracking-widest mb-1">
            PERUSAHAAN UMUM DAERAH AIR MINUM TIRTA MAKMUR KABUPATEN SUKOHARJO
          </h1>
          <h2 className="text-xl font-black mt-2 tracking-[0.2em] underline underline-offset-4">
            LEMBAR DISPOSISI
          </h2>
        </div>

        {/* Info rows */}
        <div className="grid grid-cols-2 divide-x-[3px] divide-black border-b-[3px] border-black">
          <div className="divide-y-[3px] divide-black">
            <PrintRow label="Tanggal Surat" value={format(new Date(doc.tanggalSurat), "dd MMMM yyyy", { locale: localeId })} />
            <PrintRow label="Asal Surat" value={doc.asalSurat ?? "-"} />
            <PrintRow label="Perihal" value={doc.perihal} />
          </div>
          <div className="divide-y-[3px] divide-black">
            <PrintRow label="Tanggal Terima" value={format(new Date(doc.tanggalTerima), "dd MMMM yyyy", { locale: localeId })} />
            <PrintRow label="No. Agenda" value={doc.nomorAgenda ?? "-"} />
            <PrintRow label="Nomor Surat" value={doc.nomorSurat} />
          </div>
        </div>

        {/* Disposisi Kepada + Tanggal Penyelesaian */}
        <div className="grid grid-cols-2 divide-x-[3px] divide-black border-b-[3px] border-black">
          <div className="p-4">
            <p className="font-bold uppercase tracking-wide mb-3">Disposisi Kepada :</p>
            <p className="text-lg font-bold pl-4 text-black">
              {latestDisposisi?.jabatanKe ?? "-"}
            </p>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <p className="font-bold uppercase tracking-wide mb-2">Tanggal Penyelesaian :</p>
              <p className="pl-4 font-semibold text-blue-700" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                {latestDisposisi?.tanggalTandaTangan
                  ? format(new Date(latestDisposisi.tanggalTandaTangan), "dd MMMM yyyy", { locale: localeId })
                  : "-"}
              </p>
            </div>
            {latestDisposisi?.keterangan && (
              <div>
                <p className="font-bold uppercase tracking-wide mb-2">Catatan :</p>
                <p className="pl-4 whitespace-pre-wrap font-semibold text-blue-700" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>{latestDisposisi.keterangan}</p>
              </div>
            )}
          </div>
        </div>

        {/* Instruksi */}
        <div className="p-4 min-h-[15cm]">
          <p className="font-bold uppercase tracking-wide mb-4 text-base">Isi Instruksi / Informasi :</p>
          <p className="whitespace-pre-wrap leading-relaxed text-base pl-4 pr-4 font-semibold text-blue-700" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
            {latestDisposisi?.instruksi ?? "-"}
          </p>
        </div>
      </div>
    </div>
  );
}

function PrintRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start px-4 py-3">
      <span className="font-bold shrink-0 w-36">{label}</span>
      <span className="font-bold shrink-0 mx-2">:</span>
      <span className="break-all">{value}</span>
    </div>
  );
}
