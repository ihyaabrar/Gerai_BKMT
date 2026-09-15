import {
  ValidationError,
  optionalBoolean,
  optionalString,
  requireInt,
  requireString,
} from "@/lib/validate";

export const TINGKATAN_PENGURUS = ["PD", "PC", "Permata"] as const;

/**
 * Hanya kolom ini yang boleh dikirim dari form pengurus.
 *
 * Sebelumnya isi form disimpan apa adanya (`data: body`): kolom tak dikenal
 * membuat penyimpanan gagal dengan pesan umum, dan "Urutan Tampil" yang
 * terkirim sebagai teks ditolak database tanpa penjelasan.
 */
export function parsePengurus(body: Record<string, unknown> | null, { sebagian = false } = {}) {
  const data: Record<string, unknown> = {};
  const ada = (k: string) => body?.[k] !== undefined;

  if (!sebagian || ada("nama")) data.nama = requireString(body?.nama, "Nama", { max: 150 });
  if (!sebagian || ada("jabatan")) data.jabatan = requireString(body?.jabatan, "Jabatan", { max: 150 });
  if (!sebagian || ada("tingkatan")) {
    const t = body?.tingkatan;
    if (typeof t !== "string" || !(TINGKATAN_PENGURUS as readonly string[]).includes(t)) {
      throw new ValidationError("Tingkatan harus PD, PC, atau Permata");
    }
    data.tingkatan = t;
  }
  if (ada("periode")) data.periode = optionalString(body?.periode, "Periode", { max: 20 });
  if (ada("wilayah")) data.wilayah = optionalString(body?.wilayah, "Cabang / wilayah", { max: 100 });
  if (ada("alamat")) data.alamat = optionalString(body?.alamat, "Alamat", { max: 300 });
  if (ada("nik")) data.nik = optionalString(body?.nik, "NIK", { max: 20 });
  if (ada("fotoUrl")) data.fotoUrl = optionalString(body?.fotoUrl, "Foto", { max: 500 });
  if (ada("urutan")) {
    const u = body?.urutan === "" || body?.urutan === null ? 0 : Number(body?.urutan);
    data.urutan = requireInt(u, "Urutan Tampil", { min: 0, max: 9999 });
  }
  if (ada("aktif")) data.aktif = optionalBoolean(body?.aktif, true);
  return data;
}
