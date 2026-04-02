import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {};
    if (startDate && endDate) {
      where.tanggal = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const pengeluaran = await prisma.pengeluaran.findMany({
      where,
      orderBy: { tanggal: "desc" },
    });

    return NextResponse.json(pengeluaran);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch pengeluaran" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tanggal, kategori, keterangan, jumlah } = body;

    const pengeluaran = await prisma.pengeluaran.create({
      data: {
        tanggal: new Date(tanggal),
        kategori,
        keterangan,
        jumlah: parseFloat(jumlah),
      },
    });

    return NextResponse.json(pengeluaran);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create pengeluaran" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    await prisma.pengeluaran.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete pengeluaran" }, { status: 500 });
  }
}
