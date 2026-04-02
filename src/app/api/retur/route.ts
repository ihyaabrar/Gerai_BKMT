import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const retur = await prisma.retur.findMany({
      include: {
        barang: true,
      },
      orderBy: { tanggal: "desc" },
    });

    return NextResponse.json(retur);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch retur" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { barangId, qty, alasan } = body;

    const retur = await prisma.retur.create({
      data: {
        barangId,
        qty: parseInt(qty),
        alasan,
        tanggal: new Date(),
        status: "proses",
      },
      include: {
        barang: true,
      },
    });

    // Update stok barang (kurangi)
    await prisma.barang.update({
      where: { id: barangId },
      data: {
        stok: {
          decrement: parseInt(qty),
        },
      },
    });

    return NextResponse.json(retur);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create retur" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    const retur = await prisma.retur.update({
      where: { id },
      data: { status },
      include: {
        barang: true,
      },
    });

    return NextResponse.json(retur);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update retur" }, { status: 500 });
  }
}
