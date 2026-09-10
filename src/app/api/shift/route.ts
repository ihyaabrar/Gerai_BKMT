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

    // Total penjualan per shift dihitung dari relasi, bukan lagi 0.
    const totals = await prisma.penjualan.groupBy({
      by: ["shiftId"],
      where: { shiftId: { in: shifts.map((s) => s.id) } },
      _sum: { total: true },
      _count: { _all: true },
    });
    const totalMap = new Map(
      totals.map((t) => [t.shiftId, { total: t._sum.total ?? 0, jumlah: t._count._all }])
    );

    return NextResponse.json({
      data: shifts.map((s) => ({
        ...s,
        totalPenjualan: totalMap.get(s.id)?.total ?? 0,
        jumlahTransaksi: totalMap.get(s.id)?.jumlah ?? 0,
      })),
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

      const agregat = await tx.penjualan.aggregate({
        where: { shiftId: aktif.id },
        _sum: { total: true },
        _count: { _all: true },
      });
      const totalPenjualan = agregat._sum.total ?? 0;

      const shift = await tx.shiftKasir.update({
        where: { id: aktif.id },
        data: { jamTutup: new Date(), saldoAkhir, catatan, status: "tutup" },
        include: { user: { select: { id: true, nama: true, username: true } } },
      });

      const saldoSeharusnya = shift.saldoAwal + totalPenjualan;

      return {
        ...shift,
        totalPenjualan,
        jumlahTransaksi: agregat._count._all,
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
