import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-middleware";
import {
  ValidationError,
  optionalString,
  parsePagination,
  requireNumber,
  requireOneOf,
  toErrorResponse,
} from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams, 20);

    const [shifts, total, aktif] = await Promise.all([
      prisma.shiftKasir.findMany({
        include: { user: { select: { id: true, nama: true, username: true } } },
        orderBy: { jamBuka: "desc" },
        skip,
        take: limit,
      }),
      prisma.shiftKasir.count(),
      prisma.shiftKasir.findFirst({
        where: { jamTutup: null },
        include: { user: { select: { id: true, nama: true, username: true } } },
        orderBy: { jamBuka: "desc" },
      }),
    ]);

    // Dipecah menurut metode bayar: selisih kas hanya boleh dihitung dari
    // penjualan tunai, karena transfer dan QRIS tidak masuk ke laci.
    const totals = await prisma.penjualan.groupBy({
      by: ["shiftId", "metodeBayar"],
      where: { shiftId: { in: shifts.map((s) => s.id) } },
      _sum: { total: true },
      _count: { _all: true },
    });

    const totalMap = new Map<
      string,
      { total: number; tunai: number; nonTunai: number; jumlah: number }
    >();
    for (const t of totals) {
      if (!t.shiftId) continue;
      const entry =
        totalMap.get(t.shiftId) ?? { total: 0, tunai: 0, nonTunai: 0, jumlah: 0 };
      const nilai = t._sum.total ?? 0;
      entry.total += nilai;
      entry.jumlah += t._count._all;
      if (t.metodeBayar === "Tunai") entry.tunai += nilai;
      else entry.nonTunai += nilai;
      totalMap.set(t.shiftId, entry);
    }

    return NextResponse.json({
      data: shifts.map((s) => {
        const t = totalMap.get(s.id);
        return {
          ...s,
          totalPenjualan: t?.total ?? 0,
          penjualanTunai: t?.tunai ?? 0,
          penjualanNonTunai: t?.nonTunai ?? 0,
          jumlahTransaksi: t?.jumlah ?? 0,
        };
      }),
      shiftAktif: aktif,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal memuat shift");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const action = requireOneOf(body?.action, "Aksi", ["buka", "tutup"] as const);

    if (action === "buka") {
      const saldoAwal = requireNumber(body?.saldoAwal, "Saldo awal", { min: 0 });

      const shift = await prisma.$transaction(async (tx) => {
        const aktif = await tx.shiftKasir.findFirst({ where: { jamTutup: null } });
        if (aktif) {
          throw new ValidationError("Masih ada shift yang belum ditutup");
        }
        return tx.shiftKasir.create({
          data: {
            // Diambil dari sesi login, bukan dari body request.
            // Sebelumnya nilainya hardcoded "default-user-id".
            userId: auth.user.id,
            jamBuka: new Date(),
            saldoAwal,
            status: "buka",
          },
          include: { user: { select: { id: true, nama: true, username: true } } },
        });
      });

      return NextResponse.json(shift);
    }

    const saldoAkhir = requireNumber(body?.saldoAkhir, "Saldo akhir", { min: 0 });
    const catatan = optionalString(body?.catatan, "Catatan", { max: 1000 });

    const hasil = await prisma.$transaction(async (tx) => {
      const aktif = await tx.shiftKasir.findFirst({
        where: { jamTutup: null },
        orderBy: { jamBuka: "desc" },
      });
      if (!aktif) {
        throw new ValidationError("Tidak ada shift aktif");
      }

      // Rekap kas dipecah menurut metode bayar. Yang ada di laci hanya uang
      // tunai; transfer, QRIS, dan debit tidak pernah masuk ke sana.
      const perMetode = await tx.penjualan.groupBy({
        by: ["metodeBayar"],
        where: { shiftId: aktif.id },
        _sum: { total: true },
        _count: { _all: true },
      });

      const penjualanTunai = perMetode
        .filter((m) => m.metodeBayar === "Tunai")
        .reduce((sum, m) => sum + (m._sum.total ?? 0), 0);
      const penjualanNonTunai = perMetode
        .filter((m) => m.metodeBayar !== "Tunai")
        .reduce((sum, m) => sum + (m._sum.total ?? 0), 0);
      const totalPenjualan = penjualanTunai + penjualanNonTunai;
      const jumlahTransaksi = perMetode.reduce((sum, m) => sum + m._count._all, 0);

      const shift = await tx.shiftKasir.update({
        where: { id: aktif.id },
        data: { jamTutup: new Date(), saldoAkhir, catatan, status: "tutup" },
        include: { user: { select: { id: true, nama: true, username: true } } },
      });

      // Versi sebelumnya memakai seluruh penjualan di sini, termasuk yang
      // dibayar transfer/QRIS. Setiap shift dengan pembayaran non-tunai
      // otomatis menampilkan selisih kas negatif palsu — dan orang pertama
      // yang dicurigai adalah kasirnya sendiri.
      const saldoSeharusnya = shift.saldoAwal + penjualanTunai;

      return {
        ...shift,
        totalPenjualan,
        penjualanTunai,
        penjualanNonTunai,
        rincianMetode: perMetode.map((m) => ({
          metode: m.metodeBayar,
          total: m._sum.total ?? 0,
          jumlah: m._count._all,
        })),
        jumlahTransaksi,
        saldoSeharusnya,
        selisih: saldoAkhir - saldoSeharusnya,
      };
    });

    return NextResponse.json(hasil);
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal memproses shift");
    return NextResponse.json({ error: message }, { status });
  }
}
