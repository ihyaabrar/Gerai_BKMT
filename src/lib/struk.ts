/**
 * Data struk dari penjualan yang dikembalikan server.
 *
 * Dipakai saat transaksi baru selesai di kasir dan saat struk dicetak ulang
 * dari riwayat penjualan, supaya kedua struk selalu memuat angka yang sama —
 * angka dari database, bukan dari keranjang.
 */

export interface PenjualanUntukStruk {
  nomorTransaksi: string;
  tanggal: string | Date;
  subtotal: number;
  diskon: number;
  total: number;
  bayar: number;
  kembalian: number;
  member?: { nama: string } | null;
  user?: { nama: string } | null;
  detail?: { qty: number; hargaJual: number; subtotal: number; barang?: { nama: string } | null }[];
}

export interface DataStruk {
  nomorTransaksi: string;
  tanggal: Date;
  items: { nama: string; qty: number; harga: number; subtotal: number }[];
  subtotal: number;
  diskon: number;
  total: number;
  bayar: number;
  kembalian: number;
  member?: string;
  kasir: string;
  /** Cetak ulang dari riwayat — ditandai supaya tidak dikira transaksi baru. */
  salinan?: boolean;
}

export function strukDariPenjualan(
  p: PenjualanUntukStruk,
  { kasir, salinan = false }: { kasir?: string; salinan?: boolean } = {}
): DataStruk {
  return {
    nomorTransaksi: p.nomorTransaksi,
    tanggal: new Date(p.tanggal ?? Date.now()),
    items: (p.detail ?? []).map((d) => ({
      nama: d.barang?.nama ?? "-",
      qty: d.qty,
      harga: d.hargaJual,
      subtotal: d.subtotal,
    })),
    subtotal: p.subtotal,
    diskon: p.diskon,
    total: p.total,
    bayar: p.bayar,
    kembalian: p.kembalian,
    member: p.member?.nama,
    kasir: p.user?.nama ?? kasir ?? "Kasir",
    salinan,
  };
}
