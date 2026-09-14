import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-middleware";
import { PENJUALAN_SAH } from "@/lib/keuangan";
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
      where: { ...PENJUALAN_SAH, shiftId: { in: shifts.map((s) => s.id) } },
      _sum: { total: true },
      _count: { _all: true },
    });

    // Retur pembeli yang uangnya dikembalikan tunai keluar dari laci shift itu.
    const refund = await prisma.returPenjualan.groupBy({
      by: ["shiftId"],
      where: { metodeRefund: "Tunai", shiftId: { in: shifts.map((s) => s.id) } },
      _sum: { totalRefund: true },
    });
    const refundMap = new Map(refund.map((r) => [r.shiftId, r._sum.totalRefund ?? 0]));

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
        const beku = s.jamTutup !== null && s.selisih !== null;

        // Shift yang ditutup setelah angka rekap dibekukan memakai angka
        // tersimpan. Shift yang masih buka, atau yang ditutup sebelum kolom
        // ini ada, dihitung dari transaksi seperti sebelumnya.
        const penjualanTunai = beku ? s.penjualanTunai ?? 0 : t?.tunai ?? 0;
        const penjualanNonTunai = beku ? s.penjualanNonTunai ?? 0 : t?.nonTunai ?? 0;
        const refundTunai = beku ? s.refundTunai ?? 0 : refundMap.get(s.id) ?? 0;
        const saldoSeharusnya = beku
          ? s.saldoSeharusnya ?? s.saldoAwal + penjualanTunai - refundTunai
          : s.saldoAwal + penjualanTunai - refundTunai;
        const selisih =
          s.jamTutup === null
            ? null
            : beku
              ? s.selisih
              : (s.saldoAkhir ?? 0) - saldoSeharusnya;

        return {
          ...s,
          totalPenjualan: penjualanTunai + penjualanNonTunai,
          penjualanTunai,
          penjualanNonTunai,
          refundTunai,
          saldoSeharusnya,
          selisih,
          angkaBeku: beku,
          jumlahTransaksi: t?.jumlah ?? 0,
        };
      }),
      shiftAktif: aktif,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal memuat shift", {
      endpoint: "/api/shift",
      userId: auth.user?.id,
    });
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
        where: { ...PENJUALAN_SAH, shiftId: aktif.id },
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

      // Uang retur pembeli yang dikembalikan tunai keluar dari laci yang sama.
      const refund = await tx.returPenjualan.aggregate({
        where: { shiftId: aktif.id, metodeRefund: "Tunai" },
        _sum: { totalRefund: true },
      });
      const refundTunai = refund._sum.totalRefund ?? 0;

      // Hanya uang tunai yang masuk laci. Transfer, QRIS, dan debit tidak.
      const saldoSeharusnya = aktif.saldoAwal + penjualanTunai - refundTunai;
      const selisih = saldoAkhir - saldoSeharusnya;

      // Angka rekap dibekukan bersama penutupan shift. Pembatalan transaksi
      // di hari lain tidak boleh lagi mengubah selisih shift yang sudah
      // ditutup dan ditandatangani kasirnya.
      const shift = await tx.shiftKasir.update({
        where: { id: aktif.id },
        data: {
          jamTutup: new Date(),
          saldoAkhir,
          catatan,
          status: "tutup",
          penjualanTunai,
          penjualanNonTunai,
          refundTunai,
          saldoSeharusnya,
          selisih,
        },
        include: { user: { select: { id: true, nama: true, username: true } } },
      });

      return {
        ...shift,
        totalPenjualan,
        penjualanTunai,
        penjualanNonTunai,
        refundTunai,
        rincianMetode: perMetode.map((m) => ({
          metode: m.metodeBayar,
          total: m._sum.total ?? 0,
          jumlah: m._count._all,
        })),
        jumlahTransaksi,
      };
    });

    return NextResponse.json(hasil);
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal memproses shift", {
      endpoint: "/api/shift",
      userId: auth.user?.id,
    });
    return NextResponse.json({ error: message }, { status });
  }
}
