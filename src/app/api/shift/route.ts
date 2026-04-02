import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const shifts = await prisma.shiftKasir.findMany({
      include: {
        user: true,
      },
      orderBy: { jamBuka: "desc" },
      take: 20,
    });

    return NextResponse.json(shifts);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch shifts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, userId, saldoAwal, saldoAkhir, catatan } = body;

    if (action === "buka") {
      // Cek apakah ada shift yang masih aktif
      const activeShift = await prisma.shiftKasir.findFirst({
        where: { jamTutup: null },
      });

      if (activeShift) {
        return NextResponse.json(
          { error: "Masih ada shift aktif" },
          { status: 400 }
        );
      }

      const shift = await prisma.shiftKasir.create({
        data: {
          userId,
          jamBuka: new Date(),
          saldoAwal: parseFloat(saldoAwal),
          status: "buka",
        },
        include: {
          user: true,
        },
      });

      return NextResponse.json(shift);
    } else if (action === "tutup") {
      const activeShift = await prisma.shiftKasir.findFirst({
        where: { jamTutup: null },
      });

      if (!activeShift) {
        return NextResponse.json(
          { error: "Tidak ada shift aktif" },
          { status: 400 }
        );
      }

      // Hitung total penjualan selama shift
      const penjualan = await prisma.penjualan.findMany({
        where: {
          tanggal: {
            gte: activeShift.jamBuka,
          },
        },
      });

      const totalPenjualan = penjualan.reduce((sum, p) => sum + p.total, 0);

      const shift = await prisma.shiftKasir.update({
        where: { id: activeShift.id },
        data: {
          jamTutup: new Date(),
          saldoAkhir: parseFloat(saldoAkhir),
          status: "tutup",
        },
        include: {
          user: true,
        },
      });

      return NextResponse.json(shift);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to process shift" }, { status: 500 });
  }
}
