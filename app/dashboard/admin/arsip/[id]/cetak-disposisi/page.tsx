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
        include: { dari: { select: { name: true, signature: true, role: true } } },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!doc) notFound();

  const latestDisposisi = doc.disposisi?.[0] ?? null;
  
  const ROLE_LABELS: Record<string, string> = {
    ADMIN_STAFF: "Admin Staff",
    AGENDARIS: "Agendaris",
    DIREKTUR: "Direktur Utama",
    KABAG: "Kepala Bagian",
    KASUBAG: "Kepala Sub Bagian",
  };
  
  const senderRole = latestDisposisi?.dari?.role ? ROLE_LABELS[latestDisposisi.dari.role] : "Direktur Utama";
  const senderName = latestDisposisi?.dari?.name ?? "DIREKTUR UTAMA";

  return (
    <div className="p-8 max-w-[21cm] mx-auto bg-white min-h-[29.7cm] text-black relative">
      {/* Tombol Navigasi & Print (Sembunyi saat dicetak) */}
      <div className="mb-8 flex items-center justify-between print:hidden">
        <a 
          href={`/dashboard/admin/arsip/${params.id}`}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <span>⬅️</span> Kembali ke Detail
        </a>
        <PrintButton />
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @page { size: A4; margin: 0; }
        body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        #print-area * { border-style: none; box-sizing: border-box; }
        #print-area ul { list-style-type: decimal; padding-left: 1.5rem; margin: 0; }
        #print-area li { margin-bottom: 0.25rem; }
      `}} />

      <div id="print-area" style={{ border: '3px solid black', backgroundColor: 'white', color: 'black', fontSize: '14px', fontFamily: 'sans-serif' }}>
        {/* Header */}
        <div style={{ borderBottom: '3px solid black', padding: '16px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.125rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px 0' }}>
            PERUSAHAAN UMUM DAERAH AIR MINUM TIRTA MAKMUR KABUPATEN SUKOHARJO
          </h1>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 900, marginTop: '8px', letterSpacing: '0.2em', textDecoration: 'underline', textUnderlineOffset: '4px' }}>
            LEMBAR DISPOSISI
          </h2>
        </div>

        {/* Info rows */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '3px solid black' }}>
          <div style={{ borderRight: '3px solid black', display: 'flex', flexDirection: 'column' }}>
            <PrintRow label="Tanggal Surat" value={format(new Date(doc.tanggalSurat), "dd MMMM yyyy", { locale: localeId })} borderBottom />
            <PrintRow label="Asal Surat" value={doc.asalSurat ?? "-"} borderBottom />
            <PrintRow label="Perihal" value={doc.perihal} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <PrintRow label="Tanggal Terima" value={format(new Date(doc.tanggalTerima), "dd MMMM yyyy", { locale: localeId })} borderBottom />
            <PrintRow label="No. Agenda" value={doc.nomorAgenda ?? "-"} borderBottom />
            <PrintRow label="Nomor Surat" value={doc.nomorSurat} />
          </div>
        </div>

        {/* Disposisi Kepada + Tanggal Penyelesaian */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '3px solid black' }}>
          <div style={{ padding: '16px', borderRight: '3px solid black' }}>
            <p style={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Disposisi Kepada :</p>
            <div style={{ paddingLeft: '8px', fontWeight: 'bold', color: 'black', fontSize: '16px' }}>
              {latestDisposisi?.jabatanKe ? (
                <ul>
                  {String(latestDisposisi.jabatanKe).split(",").map((j: string, i: number) => (
                    <li key={i}>{j.trim()}</li>
                  ))}
                </ul>
              ) : (
                <p>-</p>
              )}
            </div>
          </div>
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <p style={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Tanggal Penyelesaian :</p>
              <p style={{ paddingLeft: '16px', fontWeight: 600, color: '#1d4ed8' }}>
                {latestDisposisi?.tanggalTandaTangan
                  ? format(new Date(latestDisposisi.tanggalTandaTangan), "dd MMMM yyyy", { locale: localeId })
                  : "-"}
              </p>
            </div>
            {latestDisposisi?.keterangan && (
              <div>
                <p style={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Catatan :</p>
                <p style={{ paddingLeft: '16px', whiteSpace: 'pre-wrap', fontWeight: 600, color: '#1d4ed8' }}>{latestDisposisi.keterangan}</p>
              </div>
            )}
          </div>
        </div>

        {/* Instruksi & Tanda Tangan */}
        <div style={{ minHeight: '15cm', padding: '16px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <p style={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', fontSize: '16px' }}>Isi Instruksi / Informasi :</p>
          <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '16px', padding: '0 16px', fontWeight: 600, color: '#1d4ed8', flex: 1 }}>
            {latestDisposisi?.instruksi ?? "-"}
          </p>
          {latestDisposisi?.dari?.role === "DIREKTUR" && (
            <div style={{ alignSelf: 'flex-end', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '32px', marginRight: '16px', position: 'relative', minWidth: '200px' }}>
              {latestDisposisi?.dari?.signature && (
                <img
                  src={latestDisposisi.dari.signature}
                  alt="Tanda Tangan"
                  style={{ height: '120px', objectFit: 'contain', mixBlendMode: 'multiply', position: 'absolute', bottom: '40px' }}
                />
              )}
              <p style={{ fontWeight: 'bold', marginTop: '80px', textDecoration: 'underline', textAlign: 'center' }}>{senderName}</p>
              <p style={{ fontSize: '14px', fontWeight: 600, marginTop: '4px' }}>{senderRole}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PrintRow({ label, value, borderBottom }: { label: string; value: string; borderBottom?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', padding: '12px 16px', borderBottom: borderBottom ? '3px solid black' : 'none' }}>
      <span style={{ fontWeight: 'bold', flexShrink: 0, width: '144px' }}>{label}</span>
      <span style={{ fontWeight: 'bold', flexShrink: 0, margin: '0 8px' }}>:</span>
      <span style={{ wordBreak: 'break-all' }}>{value}</span>
    </div>
  );
}
