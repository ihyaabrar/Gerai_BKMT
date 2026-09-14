/**
 * Penjaga untuk skrip uji integrasi: berhenti sebelum menyentuh database yang
 * bukan milik mesin ini.
 *
 * Skrip uji menonaktifkan SELURUH nasabah, menghapus distribusi, dan membuat
 * penjualan palsu. Satu kali dijalankan dengan DATABASE_URL produksi yang
 * tertinggal di terminal, dan bagi hasil bulan itu rusak.
 */
import { readFileSync } from "node:fs";

const LOKAL = /@(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)[:/]/;

function urlDatabase() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  // Prisma membaca .env sendiri, jadi skrip yang dijalankan tanpa variabel
  // lingkungan tetap memakai isi .env — periksa yang sama.
  try {
    const isi = readFileSync(new URL("../.env", import.meta.url), "utf8");
    return isi.match(/^\s*DATABASE_URL\s*=\s*["']?([^"'\r\n]+)/m)?.[1] ?? "";
  } catch {
    return "";
  }
}

export function pastikanDatabaseLokal() {
  if (!LOKAL.test(urlDatabase())) {
    console.error(
      "Skrip uji ini MENULIS dan MENGHAPUS data, dan DATABASE_URL tidak menunjuk ke\n" +
        "database lokal (localhost/127.0.0.1). Dihentikan tanpa menyentuh apa pun."
    );
    process.exit(1);
  }
}
