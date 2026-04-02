import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const penyesuaian = await prisma.penyesuaianStok.findMany({
      include: { barang: true },
      orderBy: { tanggal: "desc" },
    });
    return NextResponse.json(penyesuaian);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch penyesuaian" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { barangId, jenis, qty, alasan } = body;

    const qtyNum = parseInt(qty);
    if (!barangId || !jenis || !qtyNum || !alasan) {
      return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 });
    }

    const barang = await prisma.barang.findUnique({ where: { id: barangId } });
    if (!barang) {
      return NextResponse.json({ error: "Barang tidak ditemukan" }, { status: 404 });
    }

    if (jenis === "keluar" && barang.stok < qtyNum) {
      return NextResponse.json({ error: "Stok tidak mencukupi" }, { status: 400 });
    }

    const penyesuaian = await prisma.penyesuaianStok.create({
      data: { barangId, jenis, qty: qtyNum, alasan },
    });

    await prisma.barang.update({
      where: { id: barangId },
      data: { stok: jenis === "masuk" ? { increment: qtyNum } : { decrement: qtyNum } },
    });

    return NextResponse.json(penyesuaian);
  } catch (error) {
    return NextResponse.json({ error: "Failed to save penyesuaian" }, { status: 500 });
  }
}
