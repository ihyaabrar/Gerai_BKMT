import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth, requireRole } from "@/lib/auth-middleware";
import {
  bagiHasil,
  bagiRata,
  hitungLaba,
  labelPeriode,
  periodeDari,
  periodeValid,
  rentangPeriode,
} from "@/lib/keuangan";
import { ValidationError, optionalString, toErrorResponse } from "@/lib/validate";

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
  totalTransaksi: number;
  persenNasabah: number;
  persenPengelola: number;
  bagianNasabah: number;
  bagianPengelola: number;
  totalInvestasi: number;
  rugi: boolean;
  detail: {
    nasabahId: string;
    namaNasabah: string;
    jumlahInvestasi: number;
    persentase: number;
    bagian: number;
  }[];
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

  const [penjualan, pengaturan, nasabah] = await Promise.all([
    db.penjualan.findMany({
      where: { tanggal: { gte: mulai, lte: selesai } },
      select: {
        total: true,
        diskon: true,
        detail: { select: { qty: true, hargaBeli: true } },
      },
    }),
    db.pengaturan.findFirst(),
    db.nasabah.findMany({ where: { aktif: true }, orderBy: { nama: "asc" } }),
  ]);

  const { totalPenjualan, totalHpp, totalDiskon, labaKotor } = hitungLaba(penjualan);

  const persenNasabah = pengaturan?.persenNasabah ?? 30;
  const persenPengelola = pengaturan?.persenPengelola ?? 70;

  const rugi = labaKotor <= 0;
  const bagi = bagiHasil(labaKotor, persenNasabah);
  const bagianNasabah = rugi ? BAGIAN_PERIODE_RUGI : bagi.bagianNasabah;
  const bagianPengelola = rugi ? Math.round(labaKotor) : bagi.bagianPengelola;

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
    totalTransaksi: penjualan.length,
    persenNasabah,
    persenPengelola,
    bagianNasabah,
    bagianPengelola,
    totalInvestasi,
    rugi,
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
    });
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal memuat distribusi");
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

      return tx.distribusiLaba.create({
        data: {
          periode,
          periodeMulai: h.periodeMulai,
          periodeSelesai: h.periodeSelesai,
          totalPenjualan: h.totalPenjualan,
          totalHpp: h.totalHpp,
          totalDiskon: h.totalDiskon,
          labaKotor: h.labaKotor,
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
    const { message, status } = toErrorResponse(error, "Gagal menutup distribusi");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  // Membuka kembali periode menghapus bukti pembagian yang sudah tercatat,
  // jadi dibatasi ke master saja.
  const auth = await requireRole(request, ["master"]);
  if (auth.error) return auth.error;

  try {
    const periode = ambilPeriode(new URL(request.url).searchParams.get("periode"));

    const tersimpan = await prisma.distribusiLaba.findUnique({ where: { periode } });
    if (!tersimpan) {
      return NextResponse.json(
        { error: `Distribusi ${labelPeriode(periode)} belum pernah ditutup` },
        { status: 404 }
      );
    }

    await prisma.distribusiLaba.delete({ where: { periode } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal membuka kembali periode");
    return NextResponse.json({ error: message }, { status });
  }
}
