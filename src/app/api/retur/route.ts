import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const retur = await prisma.retur.findMany({
      include: { barang: true },
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

    const qtyNum = parseInt(qty);
    if (!barangId || !qtyNum || !alasan) {
      return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 });
    }

    // Validasi stok
    const barang = await prisma.barang.findUnique({ where: { id: barangId } });
    if (!barang) {
      return NextResponse.json({ error: "Barang tidak ditemukan" }, { status: 404 });
    }
    if (barang.stok < qtyNum) {
      return NextResponse.json({ error: "Stok tidak mencukupi untuk retur" }, { status: 400 });
    }

    // Buat retur dengan status "proses" — stok BELUM dikurangi
    const retur = await prisma.retur.create({
      data: {
        barangId,
        qty: qtyNum,
        alasan,
        tanggal: new Date(),
        status: "proses",
      },
      include: { barang: true },
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

    const existing = await prisma.retur.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Retur tidak ditemukan" }, { status: 404 });
    }

    // Hanya kurangi stok saat status berubah ke "selesai"
    if (status === "selesai" && existing.status !== "selesai") {
      const barang = await prisma.barang.findUnique({ where: { id: existing.barangId } });
      if (!barang || barang.stok < existing.qty) {
        return NextResponse.json({ error: "Stok tidak mencukupi" }, { status: 400 });
      }
      await prisma.barang.update({
        where: { id: existing.barangId },
        data: { stok: { decrement: existing.qty } },
      });
    }

    const retur = await prisma.retur.update({
      where: { id },
      data: { status },
      include: { barang: true },
    });

    return NextResponse.json(retur);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update retur" }, { status: 500 });
  }
}
