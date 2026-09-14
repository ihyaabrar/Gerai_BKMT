import { prisma } from "@/lib/prisma";
import { PENJUALAN_SAH, labelPeriode, periodeDari, rentangPeriode } from "@/lib/keuangan";

/**
 * Distribusi bagi hasil dihitung dari daftar nasabah dan persentase yang
 * berlaku SAAT periode ditutup, bukan yang berlaku selama periode berjalan.
 * Rekaman per tanggal tidak ada, jadi hanya ada satu cara menjaga keadilannya:
 * jangan biarkan keduanya berubah di antara akhir bulan dan penutupan.
 *
 * Tanpa penjaga ini, nasabah yang mendaftar 2 Oktober ikut menerima laba
 * September penuh — dan nasabah yang keluar 30 September menerima nol,
 * padahal modalnya bekerja sebulan penuh.
 */

/**
 * Periode bulan lalu bila masih perlu ditutup lebih dulu, atau `null` bila
 * perubahan boleh dilakukan.
 *
 * Bulan lalu dianggap tidak menghalangi bila tidak ada satu pun penjualan sah
 * di dalamnya — tidak ada laba yang dibagi, jadi tidak ada yang dirugikan.
 * Tanpa pengecualian ini, aplikasi yang baru dipasang akan terkunci selamanya
 * oleh bulan-bulan kosong sebelum dipakai.
 */
export async function periodeYangHarusDitutup(): Promise<string | null> {
  const awalBulanIni = rentangPeriode(periodeDari(new Date())).mulai;
  const bulanLalu = periodeDari(new Date(awalBulanIni.getTime() - 1));

  const sudahDitutup = await prisma.distribusiLaba.findUnique({
    where: { periode: bulanLalu },
    select: { id: true },
  });
  if (sudahDitutup) return null;

  const { mulai, selesai } = rentangPeriode(bulanLalu);
  const adaPenjualan = await prisma.penjualan.count({
    where: { ...PENJUALAN_SAH, tanggal: { gte: mulai, lte: selesai } },
  });

  return adaPenjualan > 0 ? bulanLalu : null;
}

/** Pesan yang dipakai semua penjaga, supaya kalimatnya selalu sama. */
export function pesanTerkunci(periode: string, apa: string): string {
  return (
    `Distribusi ${labelPeriode(periode)} belum ditutup. ` +
    `Tutup dulu di Keuangan → Distribusi Laba sebelum ${apa} — ` +
    `kalau tidak, perubahan ini ikut menentukan pembagian ${labelPeriode(periode)}.`
  );
}
