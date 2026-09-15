/**
 * Mencocokkan hasil pindai (kamera atau pemindai USB) dengan barang.
 *
 * Pemindai USB bekerja seperti keyboard: mengetik angka barcode lalu Enter.
 * Hasilnya bisa membawa spasi/baris baru, dan sebagian pengurus mencetak
 * label berisi kode barang, bukan barcode pabrik — keduanya diterima.
 */
export function cariBarangDariPindai<T extends { kode: string; barcode?: string | null }>(
  daftar: T[],
  teks: string
): T | undefined {
  const cari = teks.trim().toLowerCase();
  if (!cari) return undefined;
  return (
    daftar.find((b) => (b.barcode ?? "").trim().toLowerCase() === cari) ??
    daftar.find((b) => b.kode.trim().toLowerCase() === cari)
  );
}
