import { formatRupiah } from "@/lib/utils";

/**
 * Slip bagi hasil untuk satu nasabah pada satu periode yang SUDAH DITUTUP.
 *
 * Semua angka diambil dari rekaman distribusi yang dibekukan, bukan dihitung
 * ulang — slip yang dicetak hari ini dan slip yang dicetak tahun depan untuk
 * bulan yang sama harus identik.
 */
export interface DataSlip {
  periode: string;
  label: string;
  ditutupPada: string;
  ditutupOleh: string | null;
  totalPenjualan: number;
  totalHpp: number;
  totalRetur: number;
  hppRetur: number;
  labaKotor: number;
  kerugianStok: number;
  persenNasabah: number;
  bagianNasabah: number;
  totalInvestasi: number;
  nasabah: {
    nasabahId: string;
    nama: string;
    telepon: string | null;
    jumlahInvestasi: number;
    persentase: number;
    bagian: number;
  };
}

export interface OrganisasiSlip {
  namaGerai: string;
  namaOrganisasi: string;
  alamat: string;
  telepon: string;
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const rp = (n: number) => esc(formatRupiah(Math.round(n)));

function tanggalPanjang(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Nomor telepon Indonesia → format wa.me ("62812…"), atau null bila tidak
 * terlihat seperti nomor HP yang valid.
 */
export function nomorWhatsApp(telepon: string | null | undefined): string | null {
  if (!telepon) return null;
  let angka = telepon.replace(/\D/g, "");
  if (angka.startsWith("0")) angka = "62" + angka.slice(1);
  else if (angka.startsWith("8")) angka = "62" + angka;
  if (!angka.startsWith("62") || angka.length < 10 || angka.length > 15) return null;
  return angka;
}

/** Pesan WhatsApp singkat berisi inti slip. */
export function pesanWhatsApp(slip: DataSlip, org: OrganisasiSlip): string {
  const n = slip.nasabah;
  return [
    `Assalamu'alaikum ${n.nama},`,
    "",
    `Berikut bagi hasil ${org.namaGerai} periode *${slip.label}*:`,
    `• Modal: ${formatRupiah(n.jumlahInvestasi)} (${n.persentase.toFixed(2)}% dari seluruh modal)`,
    `• Laba yang dibagi: ${formatRupiah(slip.labaKotor - slip.kerugianStok)}`,
    `• Bagian seluruh nasabah (${slip.persenNasabah}%): ${formatRupiah(slip.bagianNasabah)}`,
    `• *Bagian Anda: ${formatRupiah(n.bagian)}*`,
    "",
    `Angka ini tercatat saat periode ditutup pada ${tanggalPanjang(slip.ditutupPada)}.`,
    `Jazakumullah khairan.`,
    `— ${org.namaOrganisasi || org.namaGerai}`,
  ].join("\n");
}

function satuSlip(slip: DataSlip, org: OrganisasiSlip): string {
  const n = slip.nasabah;
  const labaDibagi = slip.labaKotor - slip.kerugianStok;
  const baris = (label: string, nilai: string, kelas = "") =>
    `<tr class="${kelas}"><td>${esc(label)}</td><td class="r">${nilai}</td></tr>`;

  return `<section class="slip">
  <header>
    <div class="gerai">${esc(org.namaGerai)}</div>
    ${org.namaOrganisasi ? `<div class="org">${esc(org.namaOrganisasi)}</div>` : ""}
    ${org.alamat || org.telepon ? `<div class="kontak">${esc([org.alamat, org.telepon && `Telp ${org.telepon}`].filter(Boolean).join(" · "))}</div>` : ""}
  </header>
  <h1>Slip Bagi Hasil</h1>
  <div class="periode">Periode ${esc(slip.label)}</div>

  <table class="info">
    ${baris("Nama nasabah", `<b>${esc(n.nama)}</b>`)}
    ${baris("Modal", rp(n.jumlahInvestasi))}
    ${baris("Porsi dari seluruh modal", `${n.persentase.toFixed(2)}% dari ${rp(slip.totalInvestasi)}`)}
  </table>

  <h2>Asal angka</h2>
  <table>
    ${baris("Penjualan diterima", rp(slip.totalPenjualan))}
    ${baris("Harga pokok barang terjual", "−" + rp(slip.totalHpp))}
    ${slip.totalRetur > 0 ? baris("Retur pembeli (bersih)", "−" + rp(slip.totalRetur - slip.hppRetur)) : ""}
    ${baris("Laba kotor", rp(slip.labaKotor), "sub")}
    ${slip.kerugianStok > 0 ? baris("Barang rusak / hilang", "−" + rp(slip.kerugianStok)) : ""}
    ${baris("Laba yang dibagi", rp(labaDibagi), "sub")}
    ${baris(`Bagian seluruh nasabah (${slip.persenNasabah}%)`, rp(slip.bagianNasabah))}
  </table>

  <div class="bagian">
    <span>Bagian ${esc(n.nama)}</span>
    <strong>${rp(n.bagian)}</strong>
  </div>
  <p class="rumus">${n.persentase.toFixed(2)}% × ${rp(slip.bagianNasabah)}, dibulatkan ke rupiah penuh.</p>

  <p class="catatan">Angka dibekukan saat periode ditutup pada ${esc(tanggalPanjang(slip.ditutupPada))}${slip.ditutupOleh ? ` oleh ${esc(slip.ditutupOleh)}` : ""}, dan tidak berubah walaupun data diubah kemudian.</p>

  <div class="ttd">
    <div><span>Bendahara</span></div>
    <div><span>Nasabah</span></div>
  </div>
</section>`;
}

/** HTML siap cetak (A5 potret), satu halaman per nasabah. */
export function slipHtml(slips: DataSlip[], org: OrganisasiSlip): string {
  const judul = slips.length === 1
    ? `Slip ${slips[0].nasabah.nama} ${slips[0].label}`
    : `Slip bagi hasil ${slips[0]?.label ?? ""}`;
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>${esc(judul)}</title>
<style>
@page { size: A5 portrait; margin: 12mm; }
* { box-sizing: border-box; }
body { margin: 0; font-family: "Segoe UI", Roboto, Arial, sans-serif; color: #111; font-size: 10.5pt; }
.slip { page-break-after: always; break-after: page; max-width: 125mm; margin: 0 auto; padding: 4mm 0; }
.slip:last-child { page-break-after: auto; break-after: auto; }
header { text-align: center; border-bottom: 1.5px solid #111; padding-bottom: 3mm; }
.gerai { font-size: 14pt; font-weight: 700; }
.org { font-size: 9.5pt; }
.kontak { font-size: 8.5pt; color: #444; margin-top: 1mm; }
h1 { text-align: center; font-size: 13pt; margin: 5mm 0 0; letter-spacing: .5px; text-transform: uppercase; }
.periode { text-align: center; color: #333; margin-bottom: 4mm; }
h2 { font-size: 9.5pt; text-transform: uppercase; letter-spacing: .5px; color: #555; margin: 4mm 0 1mm; }
table { width: 100%; border-collapse: collapse; }
td { padding: 1.1mm 0; vertical-align: top; }
td.r { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
tr.sub td { border-top: 1px solid #bbb; font-weight: 600; }
table.info td:first-child { color: #444; width: 45%; }
.bagian { margin-top: 5mm; border: 1.5px solid #111; border-radius: 2mm; padding: 3mm 4mm; display: flex; justify-content: space-between; align-items: baseline; gap: 4mm; }
.bagian strong { font-size: 15pt; }
.rumus { font-size: 8.5pt; color: #555; margin: 1.5mm 0 0; text-align: right; }
.catatan { font-size: 8.5pt; color: #444; margin-top: 5mm; }
.ttd { display: flex; justify-content: space-between; margin-top: 12mm; }
.ttd div { width: 42%; text-align: center; border-top: 1px solid #111; padding-top: 1mm; font-size: 9pt; }
</style></head><body>${slips.map((s) => satuSlip(s, org)).join("")}</body></html>`;
}
