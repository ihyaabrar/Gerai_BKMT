import type { Prisma } from "@prisma/client";
import { periodeBerikutnya, periodeDari } from "@/lib/keuangan";

/**
 * Modal nasabah berlaku per periode.
 *
 * Keputusan pengurus (September 2026): nasabah yang bergabung, menambah atau
 * mengurangi modal, maupun berhenti — semuanya berlaku mulai BULAN BERIKUTNYA.
 * Modal yang baru masuk tanggal 20 belum bekerja sebulan penuh, jadi belum
 * ikut dibagi bulan itu; nasabah yang berhenti tanggal 20 masih mendapat
 * bagian bulan itu karena modalnya bekerja sampai hari itu.
 *
 * Sebelumnya distribusi memakai daftar nasabah aktif pada saat periode
 * ditutup, sehingga siapa pun yang terdaftar hari itu ikut menerima laba
 * sebulan penuh.
 */

export interface BarisModal {
  nasabahId: string;
  berlakuMulai: string;
  jumlah: number;
  aktif: boolean;
}

/**
 * Untuk setiap nasabah, baris modal yang berlaku pada `periode`: baris
 * terakhir dengan `berlakuMulai <= periode`. Nasabah tanpa baris seperti itu
 * belum ikut pada periode tersebut.
 *
 * Perbandingan string aman karena formatnya selalu "YYYY-MM".
 */
export function modalBerlaku<T extends BarisModal>(baris: T[], periode: string): Map<string, T> {
  const hasil = new Map<string, T>();
  for (const b of baris) {
    if (b.berlakuMulai > periode) continue;
    const sekarang = hasil.get(b.nasabahId);
    if (!sekarang || b.berlakuMulai > sekarang.berlakuMulai) hasil.set(b.nasabahId, b);
  }
  return hasil;
}

/** Periode tempat perubahan yang dicatat hari ini mulai berlaku. */
export function periodePerubahan(sekarang: Date = new Date()): string {
  return periodeBerikutnya(periodeDari(sekarang));
}

/** Nasabah beserta modalnya yang ikut dibagi pada `periode`, urut nama. */
export async function rosterPeriode(
  db: Prisma.TransactionClient,
  periode: string
): Promise<{ id: string; nama: string; jumlahInvestasi: number }[]> {
  const baris = await db.modalNasabah.findMany({
    where: { berlakuMulai: { lte: periode } },
    include: { nasabah: { select: { nama: true } } },
  });

  return Array.from(modalBerlaku(baris, periode).values())
    .filter((b) => b.aktif && b.jumlah > 0)
    .map((b) => ({ id: b.nasabahId, nama: b.nasabah.nama, jumlahInvestasi: b.jumlah }))
    .sort((a, b) => a.nama.localeCompare(b.nama, "id"));
}

/**
 * Catat modal yang berlaku mulai `berlakuMulai`. Beberapa perubahan dalam
 * bulan yang sama menimpa satu baris yang sama — yang dipakai adalah keadaan
 * terakhir sebelum bulan itu dimulai.
 */
export async function catatModal(
  tx: Prisma.TransactionClient,
  data: BarisModal & { dibuatOlehId?: string | null }
) {
  return tx.modalNasabah.upsert({
    where: {
      nasabahId_berlakuMulai: { nasabahId: data.nasabahId, berlakuMulai: data.berlakuMulai },
    },
    update: { jumlah: data.jumlah, aktif: data.aktif, dibuatOlehId: data.dibuatOlehId ?? null },
    create: {
      nasabahId: data.nasabahId,
      berlakuMulai: data.berlakuMulai,
      jumlah: data.jumlah,
      aktif: data.aktif,
      dibuatOlehId: data.dibuatOlehId ?? null,
    },
  });
}
