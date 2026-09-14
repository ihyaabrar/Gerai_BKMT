import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { rosterPeriode } from "@/lib/modal-nasabah";
import { requireAdminAuth, requireRole } from "@/lib/auth-middleware";
import {
  PENJUALAN_SAH,
  bagiHasil,
  bagiRata,
  hitungKerugianStok,
  hitungLaba,
  labelPeriode,
  periodeDari,
  periodeValid,
  rentangPeriode,
} from "@/lib/keuangan";
import {
  ValidationError,
  optionalString,
  requireString,
  toErrorResponse,
} from "@/lib/validate";

export const dynamic = "force-dynamic";

/**
 * Bulan rugi tidak dibebankan ke nasabah.
 *
 * Ini keputusan kebijakan, bukan keputusan teknis: kalau laba negatif,
 * seluruh bagian nasabah menjadi nol dan kerugian ditanggung pengelola.
 * Alternatifnya — memotong modal nasabah — bisa saja dilakukan, tetapi harus
 * diputuskan pengurus, bukan diam-diam oleh kode.
 */
const BAGIAN_PERIODE_RUGI = 0;

interface HitunganPeriode {
  periode: string;
  periodeMulai: Date;
  periodeSelesai: Date;
  totalPenjualan: number;
  totalHpp: number;
  totalDiskon: number;
  labaKotor: number;
  /** Nilai barang rusak/hilang periode ini (penyesuaian stok). */
  kerugianStok: number;
  /** Laba yang benar-benar dibagi: labaKotor - kerugianStok. */
  labaDibagi: number;
  totalTransaksi: number;
  persenNasabah: number;
  persenPengelola: number;
  bagianNasabah: number;
  bagianPengelola: number;
  totalInvestasi: number;
  rugi: boolean;
  /** True bila daftar nasabah & persentase dipakai ulang dari rekaman yang dibuka kembali. */
  rosterDariArsip: boolean;
  detail: {
    nasabahId: string;
    namaNasabah: string;
    jumlahInvestasi: number;
    persentase: number;
    bagian: number;
  }[];
}

/** Isi kolom `data` pada DistribusiLabaArsip — salinan rekaman yang dibuka kembali. */
interface ArsipDistribusi {
  persenNasabah: number;
  persenPengelola: number;
  detail: { nasabahId: string; namaNasabah: string; jumlahInvestasi: number }[];
}

async function riwayatBuka(periode: string) {
  const arsip = await prisma.distribusiLabaArsip.findMany({
    where: { periode },
    orderBy: { dibukaPada: "desc" },
    select: {
      id: true,
      alasan: true,
      dibukaPada: true,
      dibukaOleh: { select: { nama: true } },
    },
  });
  return arsip;
}

/**
 * Menghitung distribusi satu periode dari data mentah. Dipakai untuk
 * pratinjau (sebelum ditutup) dan untuk membuat rekaman (saat ditutup),
 * supaya angka yang dilihat pengurus dan angka yang disimpan tidak mungkin
 * berbeda.
 */
async function hitungPeriode(
  db: Prisma.TransactionClient,
  periode: string
): Promise<HitunganPeriode> {
  const { mulai, selesai } = rentangPeriode(periode);

  const [penjualan, penyesuaian, pengaturan, nasabahPeriode, arsipTerakhir] = await Promise.all([
    db.penjualan.findMany({
      where: { ...PENJUALAN_SAH, tanggal: { gte: mulai, lte: selesai } },
      select: {
        total: true,
        diskon: true,
        detail: { select: { qty: true, hargaBeli: true } },
      },
    }),
    db.penyesuaianStok.findMany({
      where: { tanggal: { gte: mulai, lte: selesai } },
      select: { jenis: true, qty: true, hargaBeli: true },
    }),
    db.pengaturan.findFirst(),
    // Modal yang berlaku pada periode ini, bukan daftar nasabah aktif hari ini.
    rosterPeriode(db, periode),
    db.distribusiLabaArsip.findFirst({
      where: { periode },
      orderBy: { dibukaPada: "desc" },
    }),
  ]);

  const { totalPenjualan, totalHpp, totalDiskon, labaKotor } = hitungLaba(penjualan);

  // Barang rusak, hilang, atau kedaluwarsa sudah dibeli dengan uang gerai.
  // Nilainya dikurangkan sebelum laba dibagi (keputusan pengurus, Sept 2026).
  const kerugianStok = hitungKerugianStok(penyesuaian);
  const labaDibagi = labaKotor - kerugianStok;

  // Periode yang pernah ditutup lalu dibuka kembali memakai daftar nasabah dan
  // persentase dari rekaman sebelumnya. Membuka kembali dimaksudkan untuk
  // mengoreksi transaksi — bukan untuk mengganti siapa yang menerima bagian.
  // Tanpa ini, nasabah yang mendaftar setelah penutupan pertama ikut masuk ke
  // pembagian bulan yang sudah pernah dibayarkan.
  const arsip = arsipTerakhir?.data as unknown as ArsipDistribusi | undefined;
  const rosterDariArsip = Boolean(arsip?.detail?.length);

  const persenNasabah = rosterDariArsip
    ? arsip!.persenNasabah
    : pengaturan?.persenNasabah ?? 30;
  const persenPengelola = rosterDariArsip
    ? arsip!.persenPengelola
    : pengaturan?.persenPengelola ?? 70;

  const nasabah = rosterDariArsip
    ? arsip!.detail.map((d) => ({
        id: d.nasabahId,
        nama: d.namaNasabah,
        jumlahInvestasi: d.jumlahInvestasi,
      }))
    : nasabahPeriode;

  const rugi = labaDibagi <= 0;
  const bagi = bagiHasil(labaDibagi, persenNasabah);
  const bagianNasabah = rugi ? BAGIAN_PERIODE_RUGI : bagi.bagianNasabah;
  const bagianPengelola = rugi ? Math.round(labaDibagi) : bagi.bagianPengelola;

  const totalInvestasi = nasabah.reduce((sum, n) => sum + n.jumlahInvestasi, 0);
  const bagian = bagiRata(
    bagianNasabah,
    nasabah.map((n) => n.jumlahInvestasi)
  );

  return {
    periode,
    periodeMulai: mulai,
    periodeSelesai: selesai,
    totalPenjualan,
    totalHpp,
    totalDiskon,
    labaKotor,
    kerugianStok,
    labaDibagi,
    totalTransaksi: penjualan.length,
    persenNasabah,
    persenPengelola,
    bagianNasabah,
    bagianPengelola,
    totalInvestasi,
    rugi,
    rosterDariArsip,
    detail: nasabah.map((n, i) => ({
      nasabahId: n.id,
      namaNasabah: n.nama,
      jumlahInvestasi: n.jumlahInvestasi,
      persentase:
        totalInvestasi > 0 ? (n.jumlahInvestasi / totalInvestasi) * 100 : 0,
      bagian: bagian[i] ?? 0,
    })),
  };
}

function ambilPeriode(nilai: string | null): string {
  const periode = nilai ?? periodeDari(new Date());
  if (!periodeValid(periode)) {
    throw new ValidationError("Periode harus berformat YYYY-MM, misalnya 2026-09");
  }
  return periode;
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);

    // Daftar seluruh periode yang sudah ditutup, untuk pemilih periode.
    if (searchParams.get("daftar") === "1") {
      const daftar = await prisma.distribusiLaba.findMany({
        orderBy: { periode: "desc" },
        take: 60,
        select: {
          periode: true,
          labaKotor: true,
          bagianNasabah: true,
          createdAt: true,
          dibuatOleh: { select: { nama: true } },
        },
      });
      return NextResponse.json({ daftar });
    }

    const periode = ambilPeriode(searchParams.get("periode"));

    // Periode yang sudah ditutup selalu dibaca apa adanya dari rekaman —
    // tidak pernah dihitung ulang. Itulah gunanya rekaman ini ada.
    const tersimpan = await prisma.distribusiLaba.findUnique({
      where: { periode },
      include: {
        detail: { orderBy: { namaNasabah: "asc" } },
        dibuatOleh: { select: { nama: true } },
      },
    });

    if (tersimpan) {
      return NextResponse.json({
        status: "ditutup",
        label: labelPeriode(periode),
        distribusi: tersimpan,
        riwayatBuka: await riwayatBuka(periode),
      });
    }

    const hitungan = await prisma.$transaction((tx) => hitungPeriode(tx, periode));
    const { selesai } = rentangPeriode(periode);

    return NextResponse.json({
      status: "pratinjau",
      label: labelPeriode(periode),
      // Periode yang belum berakhir masih bisa berubah sampai hari terakhir.
      bisaDitutup: selesai.getTime() < Date.now(),
      distribusi: hitungan,
      riwayatBuka: await riwayatBuka(periode),
    });
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal memuat distribusi", {
      endpoint: "/api/distribusi",
      userId: auth.user?.id,
    });
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const periode = ambilPeriode(
      typeof body?.periode === "string" ? body.periode : null
    );
    const catatan = optionalString(body?.catatan, "Catatan", { max: 500 });

    const { selesai } = rentangPeriode(periode);
    if (selesai.getTime() >= Date.now()) {
      throw new ValidationError(
        `Periode ${labelPeriode(periode)} belum berakhir. Distribusi baru bisa ditutup setelah bulannya selesai.`
      );
    }

    const hasil = await prisma.$transaction(async (tx) => {
      const sudahAda = await tx.distribusiLaba.findUnique({ where: { periode } });
      if (sudahAda) {
        throw new ValidationError(
          `Distribusi ${labelPeriode(periode)} sudah pernah ditutup.`
        );
      }

      const h = await hitungPeriode(tx, periode);

      // Aplikasi hanya menonaktifkan nasabah, tidak pernah menghapusnya. Tetapi
      // bila seseorang menghapus langsung dari database, penutupan akan gagal
      // di foreign key tanpa penjelasan — lebih baik katakan apa yang hilang.
      if (h.rosterDariArsip) {
        const ada = await tx.nasabah.findMany({
          where: { id: { in: h.detail.map((d) => d.nasabahId) } },
          select: { id: true },
        });
        const idAda = new Set(ada.map((n) => n.id));
        const hilang = h.detail.filter((d) => !idAda.has(d.nasabahId));
        if (hilang.length > 0) {
          throw new ValidationError(
            `Periode ini memakai daftar nasabah dari penutupan sebelumnya, tetapi ` +
              `data nasabah berikut sudah terhapus dari database: ` +
              `${hilang.map((d) => d.namaNasabah).join(", ")}. Hubungi pengelola aplikasi.`
          );
        }
      }

      return tx.distribusiLaba.create({
        data: {
          periode,
          periodeMulai: h.periodeMulai,
          periodeSelesai: h.periodeSelesai,
          totalPenjualan: h.totalPenjualan,
          totalHpp: h.totalHpp,
          totalDiskon: h.totalDiskon,
          totalTransaksi: h.totalTransaksi,
          labaKotor: h.labaKotor,
          kerugianStok: h.kerugianStok,
          persenNasabah: h.persenNasabah,
          persenPengelola: h.persenPengelola,
          bagianNasabah: h.bagianNasabah,
          bagianPengelola: h.bagianPengelola,
          totalInvestasi: h.totalInvestasi,
          catatan,
          dibuatOlehId: auth.user.id,
          detail: {
            create: h.detail.map((d) => ({
              nasabahId: d.nasabahId,
              namaNasabah: d.namaNasabah,
              jumlahInvestasi: d.jumlahInvestasi,
              persentase: d.persentase,
              bagian: d.bagian,
            })),
          },
        },
        include: {
          detail: { orderBy: { namaNasabah: "asc" } },
          dibuatOleh: { select: { nama: true } },
        },
      });
    });

    return NextResponse.json({ status: "ditutup", distribusi: hasil });
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal menutup distribusi", {
      endpoint: "/api/distribusi",
      userId: auth.user?.id,
    });
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  // Membuka kembali periode mengubah angka yang mungkin sudah dibayarkan ke
  // nasabah, jadi dibatasi ke master saja.
  const auth = await requireRole(request, ["master"]);
  if (auth.error) return auth.error;

  try {
    const url = new URL(request.url);
    const periode = ambilPeriode(url.searchParams.get("periode"));
    const alasan = requireString(url.searchParams.get("alasan"), "Alasan membuka kembali", {
      min: 10,
      max: 500,
    });

    await prisma.$transaction(async (tx) => {
      const tersimpan = await tx.distribusiLaba.findUnique({
        where: { periode },
        include: { detail: true },
      });
      if (!tersimpan) {
        throw new ValidationError(`Distribusi ${labelPeriode(periode)} belum pernah ditutup`);
      }

      // Rekaman tidak dihapus tanpa jejak: isinya utuh — termasuk bagian setiap
      // nasabah yang mungkin sudah dibayarkan — disalin ke arsip lebih dulu,
      // bersama siapa yang membuka, kapan, dan kenapa.
      await tx.distribusiLabaArsip.create({
        data: {
          periode,
          data: JSON.parse(JSON.stringify(tersimpan)),
          alasan,
          dibukaOlehId: auth.user.id,
        },
      });

      await tx.distribusiLaba.delete({ where: { periode } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal membuka kembali periode", {
      endpoint: "/api/distribusi",
      userId: auth.user?.id,
    });
    return NextResponse.json({ error: message }, { status });
  }
}
