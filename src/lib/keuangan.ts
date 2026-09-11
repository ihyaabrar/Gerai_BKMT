/**
 * Satu sumber kebenaran untuk semua angka keuangan.
 *
 * Sebelum berkas ini ada, "laba" punya tiga definisi berbeda yang tersebar di
 * halaman dashboard, laporan, dan keuangan — dan ketiganya memberi angka yang
 * berbeda untuk bulan yang sama. Semua perhitungan sekarang lewat sini.
 */

/**
 * Pembelian barang dagangan bukan biaya operasional: nilainya sudah ikut
 * terhitung sebagai harga pokok pada setiap penjualan. Menguranginya lagi
 * dari laba berarti menghitung modal barang dua kali.
 */
export const KATEGORI_PEMBELIAN_BARANG = "Pembelian Barang";

/**
 * Server produksi berjalan pada UTC, sementara toko dan seluruh laporannya
 * memakai WIB. Tanpa penyesuaian ini, transaksi pukul 06.30 WIB tanggal 1
 * masuk ke laporan tanggal 31 bulan sebelumnya.
 */
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
const SEHARI_MS = 24 * 60 * 60 * 1000;

/** Awal hari (00:00:00.000 WIB) yang memuat `waktu`. */
export function awalHariWIB(waktu: Date): Date {
  const geser = waktu.getTime() + WIB_OFFSET_MS;
  return new Date(Math.floor(geser / SEHARI_MS) * SEHARI_MS - WIB_OFFSET_MS);
}

/** Akhir hari (23:59:59.999 WIB) yang memuat `waktu`. */
export function akhirHariWIB(waktu: Date): Date {
  return new Date(awalHariWIB(waktu).getTime() + SEHARI_MS - 1);
}

/** Periode ditulis "YYYY-MM" menurut kalender WIB, mis. "2026-09". */
export function periodeDari(waktu: Date): string {
  const wib = new Date(waktu.getTime() + WIB_OFFSET_MS);
  return `${wib.getUTCFullYear()}-${String(wib.getUTCMonth() + 1).padStart(2, "0")}`;
}

const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export function labelPeriode(periode: string): string {
  const [tahun, bulan] = periode.split("-").map(Number);
  const nama = NAMA_BULAN[bulan - 1];
  return nama ? `${nama} ${tahun}` : periode;
}

export function periodeValid(periode: unknown): periode is string {
  if (typeof periode !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(periode)) {
    return false;
  }
  const tahun = Number(periode.slice(0, 4));
  return tahun >= 2000 && tahun <= 2200;
}

/** Batas awal dan akhir satu periode "YYYY-MM", dinyatakan dalam WIB. */
export function rentangPeriode(periode: string): { mulai: Date; selesai: Date } {
  const [tahun, bulan] = periode.split("-").map(Number);
  const mulai = new Date(Date.UTC(tahun, bulan - 1, 1) - WIB_OFFSET_MS);
  const selesai = new Date(Date.UTC(tahun, bulan, 1) - WIB_OFFSET_MS - 1);
  return { mulai, selesai };
}

// ─── Laba ────────────────────────────────────────────────────────────────────

export interface BarisPenjualan {
  qty: number;
  /** Harga pokok yang dibekukan saat transaksi, bukan harga beli hari ini. */
  hargaBeli: number;
}

export interface TransaksiPenjualan {
  /** Nilai yang benar-benar dibayar pembeli, sudah dipotong diskon. */
  total: number;
  diskon: number;
  detail: BarisPenjualan[];
}

export function hppTransaksi(p: TransaksiPenjualan): number {
  return p.detail.reduce((sum, d) => sum + d.hargaBeli * d.qty, 0);
}

/**
 * Laba kotor satu transaksi.
 *
 * Memakai `total` (bukan subtotal) berarti diskon member otomatis ikut
 * terpotong. Versi sebelumnya menghitung `(hargaJual - hargaBeli) * qty` tanpa
 * menyentuh diskon sama sekali, sehingga laba dilaporkan lebih tinggi dari
 * kenyataan — dan 30% dari angka yang keliru itulah yang dijanjikan ke nasabah.
 */
export function labaTransaksi(p: TransaksiPenjualan): number {
  return p.total - hppTransaksi(p);
}

export interface RingkasanLaba {
  totalPenjualan: number;
  totalHpp: number;
  totalDiskon: number;
  labaKotor: number;
}

export function hitungLaba(penjualan: TransaksiPenjualan[]): RingkasanLaba {
  let totalPenjualan = 0;
  let totalHpp = 0;
  let totalDiskon = 0;

  for (const p of penjualan) {
    totalPenjualan += p.total;
    totalHpp += hppTransaksi(p);
    totalDiskon += p.diskon;
  }

  return {
    totalPenjualan,
    totalHpp,
    totalDiskon,
    labaKotor: totalPenjualan - totalHpp,
  };
}

// ─── Pembagian ───────────────────────────────────────────────────────────────

/**
 * Membagi `total` rupiah menurut `bobot`, dalam rupiah bulat.
 *
 * Pembagian pro-rata hampir selalu menghasilkan pecahan. Sisa rupiahnya
 * diberikan ke pecahan terbesar lebih dulu (largest remainder), sehingga
 * jumlah seluruh bagian **selalu persis sama** dengan total yang dibagikan.
 * Tanpa aturan ini, laporan akan meleset beberapa rupiah dan seseorang akan
 * menanyakannya.
 */
export function bagiRata(total: number, bobot: number[]): number[] {
  if (bobot.length === 0) return [];

  const totalBobot = bobot.reduce((a, b) => a + b, 0);
  if (totalBobot <= 0) return bobot.map(() => 0);

  const bulat = Math.round(total);
  const mentah = bobot.map((b) => (b / totalBobot) * bulat);
  const hasil = mentah.map((v) => Math.floor(v));

  const urutPecahan = mentah
    .map((v, i) => ({ i, pecahan: v - Math.floor(v) }))
    .sort((a, b) => b.pecahan - a.pecahan || a.i - b.i);

  let sisa = bulat - hasil.reduce((a, b) => a + b, 0);
  for (let k = 0; sisa > 0 && k < urutPecahan.length; k++, sisa--) {
    hasil[urutPecahan[k].i] += 1;
  }
  return hasil;
}

/**
 * Bagian nasabah dan pengelola. Bagian pengelola dihitung sebagai sisa, bukan
 * dari persennya sendiri, supaya keduanya selalu berjumlah persis `labaKotor`
 * walaupun persentasenya diubah dan tidak genap 100.
 */
export function bagiHasil(
  labaKotor: number,
  persenNasabah: number
): { bagianNasabah: number; bagianPengelola: number } {
  const bulat = Math.round(labaKotor);
  const bagianNasabah = Math.round((bulat * persenNasabah) / 100);
  return { bagianNasabah, bagianPengelola: bulat - bagianNasabah };
}
