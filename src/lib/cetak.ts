import { KOLOM, strukKeEscPos, susunStruk, type IdentitasStruk, type LebarKertas } from "@/lib/escpos";
import { kirimKePrinter, pilihPrinter, printerTersambung, sambungUlang } from "@/lib/printer-bluetooth";
import type { DataStruk } from "@/lib/struk";
import type { MetodeCetak } from "@/store/printer";

/**
 * Isian contoh dari seed lama. Database produksi yang di-seed sebelum
 * perbaikan struk masih menyimpannya; struk tidak boleh mencetak alamat dan
 * nomor telepon rekaan kepada pembeli.
 */
const ISIAN_CONTOH = new Set(["Jl. Contoh No. 123", "081234567890"]);

const bersihkan = (nilai: unknown): string => {
  const teks = typeof nilai === "string" ? nilai.trim() : "";
  return ISIAN_CONTOH.has(teks) ? "" : teks;
};

export const TOKO_BAWAAN: IdentitasStruk = { nama: "Gerai BKMT", alamat: "", telepon: "" };

/** Kepala struk dari Sistem → Pengaturan. */
export async function ambilIdentitasToko(): Promise<IdentitasStruk> {
  try {
    const res = await fetch("/api/pengaturan");
    if (!res.ok) return TOKO_BAWAAN;
    const p = await res.json();
    return {
      nama: bersihkan(p.namaToko) || TOKO_BAWAAN.nama,
      alamat: bersihkan(p.alamatToko),
      telepon: bersihkan(p.teleponToko),
    };
  } catch {
    return TOKO_BAWAAN;
  }
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** HTML struk dengan susunan baris yang sama persis dengan printer thermal. */
export function strukHtml(data: DataStruk, toko: IdentitasStruk, lebar: LebarKertas): string {
  const baris = susunStruk(data, toko, lebar)
    .map((b) => {
      const isi = escapeHtml(b.teks) || "&nbsp;";
      const kelas = [b.rata === "tengah" ? "c" : "", b.tebal ? "b" : "", b.besar ? "l" : ""].join(" ").trim();
      return `<div class="${kelas}">${isi}</div>`;
    })
    .join("");

  // Lebar huruf dihitung dari jumlah kolom supaya satu baris pas selebar kertas.
  const lebarIsi = lebar === 58 ? 48 : 72; // mm area cetak
  const ukuranHuruf = ((lebarIsi / KOLOM[lebar]) * 1.65).toFixed(2);
  return `<!doctype html><html><head><meta charset="utf-8"><title>Struk ${escapeHtml(data.nomorTransaksi)}</title>
<style>
@page { size: ${lebar}mm auto; margin: 0; }
html, body { margin: 0; padding: 0; }
body { width: ${lebar}mm; padding: 2mm ${(lebar - lebarIsi) / 2}mm 6mm; box-sizing: border-box;
  font-family: "Courier New", Courier, monospace; font-size: ${ukuranHuruf}mm; line-height: 1.25; color: #000; }
div { white-space: pre; }
.c { text-align: center; } .b { font-weight: bold; } .l { font-size: 2em; line-height: 1.1; }
</style></head><body>${baris}</body></html>`;
}

/**
 * Cetak lewat dialog cetak browser memakai iframe tersembunyi.
 *
 * Bukan window.open: jendela baru diblokir browser bila tidak dibuka langsung
 * dari klik — padahal cetak otomatis setelah transaksi justru terjadi setelah
 * menunggu jawaban server.
 */
export function cetakLewatSistem(html: string): Promise<void> {
  return new Promise((selesai) => {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument!;
    doc.open();
    doc.write(html);
    doc.close();
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      // Beri waktu dialog cetak terbuka sebelum iframe dibuang.
      setTimeout(() => {
        iframe.remove();
        selesai();
      }, 1000);
    }, 250);
  });
}

export interface PengaturanCetak {
  metode: MetodeCetak;
  lebar: LebarKertas;
  perangkatId: string | null;
}

/**
 * Cetak struk sesuai pengaturan perangkat ini.
 *
 * `bolehPilihPrinter` hanya true bila dipanggil dari klik: memilih printer
 * Bluetooth membuka jendela browser yang wajib dipicu pengguna. Cetak
 * otomatis tidak boleh membukanya, jadi hanya berhasil bila printer sudah
 * tersambung sebelumnya.
 *
 * Mengembalikan printer yang baru dipilih (bila ada) supaya bisa disimpan.
 */
export async function cetakStruk(
  data: DataStruk,
  toko: IdentitasStruk,
  pengaturan: PengaturanCetak,
  { bolehPilihPrinter }: { bolehPilihPrinter: boolean }
): Promise<{ printerBaru?: { id: string; nama: string } }> {
  if (pengaturan.metode === "sistem") {
    await cetakLewatSistem(strukHtml(data, toko, pengaturan.lebar));
    return {};
  }

  let printerBaru: { id: string; nama: string } | undefined;
  if (!printerTersambung() && !(await sambungUlang(pengaturan.perangkatId))) {
    if (!bolehPilihPrinter) {
      throw new Error("Printer Bluetooth belum tersambung. Tekan Cetak Struk untuk menyambungkan.");
    }
    printerBaru = await pilihPrinter();
  }
  await kirimKePrinter(strukKeEscPos(data, toko, pengaturan.lebar));
  return { printerBaru };
}
