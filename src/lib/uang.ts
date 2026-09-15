/**
 * Bantuan isian uang untuk kasir: angka ditampilkan dengan titik ribuan
 * ("150.000") tetapi disimpan sebagai angka bulat.
 */

/** "Rp 150.000" / "150.000" / "150000" -> 150000. Kosong -> null. */
export function angkaDariTeks(teks: string): number | null {
  const digit = teks.replace(/\D/g, "");
  if (!digit) return null;
  return Number(digit);
}

/** 150000 -> "150.000". */
export function teksRibuan(nilai: number | null): string {
  if (nilai === null || !Number.isFinite(nilai)) return "";
  return Math.round(nilai).toLocaleString("id-ID");
}

/**
 * Pilihan uang yang paling mungkin diserahkan pembeli untuk total tertentu:
 * total dibulatkan ke atas ke kelipatan pecahan uang yang umum, lalu diambil
 * beberapa yang terkecil. Total 23.500 -> 25.000, 30.000, 40.000, 50.000.
 */
export function saranUangBayar(total: number, jumlah = 4): number[] {
  if (!(total > 0)) return [];
  const pecahan = [5_000, 10_000, 20_000, 50_000, 100_000];
  const hasil = new Set<number>();
  for (const p of pecahan) {
    const naik = Math.ceil(total / p) * p;
    if (naik > total) hasil.add(naik);
  }
  return Array.from(hasil)
    .sort((a, b) => a - b)
    .slice(0, jumlah);
}
