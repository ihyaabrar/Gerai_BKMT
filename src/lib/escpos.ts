import type { DataStruk } from "@/lib/struk";

/**
 * Struk untuk printer thermal (perintah ESC/POS).
 *
 * Printer thermal murah — 58 mm maupun 80 mm, Bluetooth maupun USB — memahami
 * bahasa perintah yang sama. Struk disusun sebagai baris teks dengan lebar
 * karakter tetap, lalu diubah menjadi byte yang dikirim langsung ke printer
 * tanpa melewati dialog cetak browser.
 */

export type LebarKertas = 58 | 80;

/** Jumlah karakter per baris dengan huruf standar (Font A). */
export const KOLOM: Record<LebarKertas, number> = { 58: 32, 80: 48 };

export interface IdentitasStruk {
  nama: string;
  alamat: string;
  telepon: string;
  /** Baris tambahan di bawah alamat, dari halaman Printer. Boleh beberapa baris. */
  header?: string;
  /** Pengganti "Terima Kasih / Selamat Berbelanja Kembali". */
  footer?: string;
  /** Logo di atas struk; kosong = tanpa logo. */
  logoUrl?: string | null;
}

export const FOOTER_BAWAAN = "Terima Kasih\nSelamat Berbelanja Kembali";

/** Logo yang sudah diubah jadi titik hitam-putih untuk printer thermal. */
export interface RasterLogo {
  /** Lebar dalam titik (dot), kelipatan 8. */
  lebar: number;
  tinggi: number;
  /** Satu bit per titik, baris demi baris, 1 = hitam. */
  data: Uint8Array;
}

export type Rata = "kiri" | "tengah";

export interface BarisStruk {
  teks: string;
  rata?: Rata;
  tebal?: boolean;
  /** Huruf dua kali lebar & tinggi — hanya untuk nama toko. */
  besar?: boolean;
}

/**
 * Printer thermal hanya pasti mengenal ASCII. Huruf beraksen diganti huruf
 * dasarnya, tanda baca tipografis diganti padanan ASCII, sisanya "?".
 */
export function teksPolos(teks: string): string {
  return teks
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u00a0/g, " ")
    .replace(/[^\x20-\x7e]/g, "?");
}

/** "Rp10.000" — tanpa spasi tak-terputus yang dipakai Intl. */
export function rupiahPolos(nilai: number): string {
  const bulat = Math.round(nilai);
  const angka = Math.abs(bulat).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${bulat < 0 ? "-" : ""}Rp${angka}`;
}

/** Pecah teks menjadi baris selebar `lebar`, memotong di spasi bila bisa. */
export function bungkus(teks: string, lebar: number): string[] {
  const hasil: string[] = [];
  let sisa = teksPolos(teks).trim();
  while (sisa.length > lebar) {
    let potong = sisa.lastIndexOf(" ", lebar);
    if (potong <= 0) potong = lebar;
    hasil.push(sisa.slice(0, potong).trimEnd());
    sisa = sisa.slice(potong).trimStart();
  }
  hasil.push(sisa);
  return hasil;
}

/**
 * Teks kiri dan kanan dalam satu baris. Bila tidak muat, teks kiri dibungkus
 * dan teks kanan ditaruh rata kanan di baris terakhir (atau baris sendiri).
 */
export function duaKolom(kiri: string, kanan: string, lebar: number): string[] {
  const k = teksPolos(kanan);
  const baris = bungkus(kiri, lebar);
  const terakhir = baris[baris.length - 1];
  if (terakhir.length + 1 + k.length <= lebar) {
    baris[baris.length - 1] = terakhir + " ".repeat(lebar - terakhir.length - k.length) + k;
  } else {
    baris.push(" ".repeat(Math.max(0, lebar - k.length)) + k.slice(-lebar));
  }
  return baris;
}

function pukul(tanggal: Date): string {
  const dua = (n: number) => String(n).padStart(2, "0");
  return (
    `${dua(tanggal.getDate())}/${dua(tanggal.getMonth() + 1)}/${tanggal.getFullYear()} ` +
    `${dua(tanggal.getHours())}:${dua(tanggal.getMinutes())}`
  );
}

/** Susunan baris struk. Dipisah dari byte supaya bisa diuji dan dipratinjau. */
export function susunStruk(data: DataStruk, toko: IdentitasStruk, lebarKertas: LebarKertas): BarisStruk[] {
  const lebar = KOLOM[lebarKertas];
  const garis = "-".repeat(lebar);
  const b: BarisStruk[] = [];
  const kiri = (teks: string, tebal = false) => b.push({ teks, tebal });
  const tengah = (teks: string, tebal = false) =>
    bungkus(teks, lebar).forEach((t) => b.push({ teks: t, rata: "tengah", tebal }));

  // Huruf besar dua kali lebar: separuh kolom.
  bungkus(toko.nama.toUpperCase(), Math.floor(lebar / 2)).forEach((t) =>
    b.push({ teks: t, rata: "tengah", tebal: true, besar: true })
  );
  if (toko.alamat) tengah(toko.alamat);
  if (toko.telepon) tengah(`Telp: ${toko.telepon}`);
  barisTeks(toko.header).forEach((t) => tengah(t));
  kiri(garis);

  if (data.salinan) tengah("*** SALINAN ***", true);
  duaKolom("No:", data.nomorTransaksi, lebar).forEach((t) => kiri(t));
  duaKolom("Tanggal:", pukul(new Date(data.tanggal)), lebar).forEach((t) => kiri(t));
  duaKolom("Kasir:", data.kasir, lebar).forEach((t) => kiri(t));
  if (data.member) duaKolom("Member:", data.member, lebar).forEach((t) => kiri(t));
  kiri(garis);

  for (const item of data.items) {
    bungkus(item.nama, lebar).forEach((t) => kiri(t));
    duaKolom(`  ${item.qty} x ${rupiahPolos(item.harga)}`, rupiahPolos(item.subtotal), lebar).forEach((t) =>
      kiri(t)
    );
  }
  kiri(garis);

  duaKolom("Subtotal", rupiahPolos(data.subtotal), lebar).forEach((t) => kiri(t));
  if (data.diskon > 0) {
    const persen = data.subtotal > 0 ? ` (${Math.round((data.diskon / data.subtotal) * 100)}%)` : "";
    duaKolom(`Diskon${persen}`, `-${rupiahPolos(data.diskon)}`, lebar).forEach((t) => kiri(t));
  }
  duaKolom("TOTAL", rupiahPolos(data.total), lebar).forEach((t) => kiri(t, true));
  duaKolom("Bayar", rupiahPolos(data.bayar), lebar).forEach((t) => kiri(t));
  duaKolom("Kembalian", rupiahPolos(data.kembalian), lebar).forEach((t) => kiri(t));
  kiri(garis);

  barisTeks(toko.footer?.trim() ? toko.footer : FOOTER_BAWAAN).forEach((t) => tengah(t));
  return b;
}

/** Teks bebas dari pengurus: dipecah per baris, baris kosong di ujung dibuang. */
function barisTeks(teks: string | undefined): string[] {
  if (!teks) return [];
  const rapi = teks.trim();
  if (!rapi) return [];
  return rapi.split(/\r?\n/).map((t) => t.trim());
}

/** Perintah ESC/POS "GS v 0": cetak gambar raster, rata tengah. */
export function perintahRaster(logo: RasterLogo): number[] {
  const perBaris = logo.lebar / 8;
  return [
    ESC, 0x61, 1,
    GS, 0x76, 0x30, 0,
    perBaris & 0xff, (perBaris >> 8) & 0xff,
    logo.tinggi & 0xff, (logo.tinggi >> 8) & 0xff,
    ...logo.data,
    LF,
  ];
}

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

/** Byte ESC/POS siap kirim ke printer. */
export function strukKeEscPos(
  data: DataStruk,
  toko: IdentitasStruk,
  lebarKertas: LebarKertas,
  logo?: RasterLogo | null
): Uint8Array {
  const byte: number[] = [ESC, 0x40]; // inisialisasi printer
  if (logo) byte.push(...perintahRaster(logo));

  for (const baris of susunStruk(data, toko, lebarKertas)) {
    byte.push(ESC, 0x61, baris.rata === "tengah" ? 1 : 0);
    byte.push(ESC, 0x45, baris.tebal ? 1 : 0);
    byte.push(GS, 0x21, baris.besar ? 0x11 : 0x00);
    for (const ch of teksPolos(baris.teks)) byte.push(ch.charCodeAt(0));
    byte.push(LF);
  }

  // Kembalikan gaya, dorong kertas melewati pisau, lalu potong. Printer tanpa
  // pisau mengabaikan perintah potong.
  byte.push(ESC, 0x61, 0, ESC, 0x45, 0, GS, 0x21, 0);
  byte.push(ESC, 0x64, 4);
  byte.push(GS, 0x56, 0x42, 0x00);
  return Uint8Array.from(byte);
}
