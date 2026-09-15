/**
 * Menyusun pengurus menjadi bagan bertingkat berdasarkan nama jabatan.
 *
 * Tingkat ditebak dari kata di jabatan, bukan dari kolom tersendiri, supaya
 * data yang sudah diisi pengurus langsung tersusun tanpa diisi ulang. Salah
 * ketik yang umum ("Penaashet", "Sekretris") tetap dikenali.
 *
 * Urutan di dalam satu tingkat tetap mengikuti "Urutan Tampil".
 */

export type Jenjang = "penasehat" | "ketua" | "wakil" | "sekretaris" | "bendahara" | "lainnya";

export const LABEL_JENJANG: Record<Jenjang, string> = {
  penasehat: "Penasehat",
  ketua: "Ketua",
  wakil: "Wakil Ketua",
  sekretaris: "Sekretaris",
  bendahara: "Bendahara",
  lainnya: "Bidang & Anggota",
};

export function jenjangJabatan(jabatan: string): Jenjang {
  const kata = jabatan
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const ada = (cocok: (k: string) => boolean) => kata.some(cocok);

  // Penasehat, penasihat, "penaashet", pembina, pelindung.
  if (ada((k) => /^pena+s/.test(k) || k === "pembina" || k === "pelindung")) return "penasehat";
  // Sekretaris, "sekretris", "sekertaris" — tetapi bukan "seksi".
  if (ada((k) => /^sek(r|ert)/.test(k))) return "sekretaris";
  if (ada((k) => k.startsWith("bendah"))) return "bendahara";
  // "Ketua Bidang Dakwah", "Koordinator Seksi …" memimpin bidangnya, bukan
  // organisasinya.
  if (ada((k) => ["bidang", "seksi", "divisi", "departemen", "koordinator", "korwil"].includes(k))) {
    return "lainnya";
  }
  if (ada((k) => k === "wakil" || k === "waka") && ada((k) => k === "ketua")) return "wakil";
  if (ada((k) => k === "ketua")) return "ketua";
  return "lainnya";
}

/** Urutan tingkat dari atas ke bawah bagan. */
export const URUTAN_JENJANG: Record<Jenjang, number> = {
  penasehat: 0,
  ketua: 1,
  wakil: 2,
  sekretaris: 3,
  bendahara: 4,
  lainnya: 5,
};

export type Struktur<T> = Record<Jenjang, T[]>;

export function susunStruktur<T extends { jabatan: string }>(daftar: T[]): Struktur<T> {
  const hasil: Struktur<T> = {
    penasehat: [],
    ketua: [],
    wakil: [],
    sekretaris: [],
    bendahara: [],
    lainnya: [],
  };
  for (const p of daftar) hasil[jenjangJabatan(p.jabatan)].push(p);
  return hasil;
}

/**
 * Bagan hanya berguna bila ada ketua dan setidaknya satu tingkat lain.
 * Pimpinan Cabang yang isinya para ketua kecamatan tetap tampil sejajar.
 */
export function perluBagan<T>(s: Struktur<T>): boolean {
  if (s.ketua.length === 0) return false;
  const tingkatLain = (["penasehat", "wakil", "sekretaris", "bendahara", "lainnya"] as const).filter(
    (j) => s[j].length > 0
  ).length;
  return tingkatLain > 0 && s.ketua.length <= 2;
}
