import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const kategori = await prisma.kategoriPengeluaran.findMany({
      where: { aktif: true },
      orderBy: { nama: "asc" },
    });
    return NextResponse.json(kategori);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch kategori" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nama } = body;
    if (!nama || !nama.trim()) {
      return NextResponse.json({ error: "Nama kategori wajib diisi" }, { status: 400 });
    }
    const existing = await prisma.kategoriPengeluaran.findUnique({ where: { nama: nama.trim() } });
    if (existing) {
      if (!existing.aktif) {
        const restored = await prisma.kategoriPengeluaran.update({
          where: { id: existing.id },
          data: { aktif: true },
        });
        return NextResponse.json(restored);
      }
      return NextResponse.json({ error: "Kategori sudah ada" }, { status: 400 });
    }
    const kategori = await prisma.kategoriPengeluaran.create({
      data: { nama: nama.trim() },
    });
    return NextResponse.json(kategori);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create kategori" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    await prisma.kategoriPengeluaran.update({ where: { id }, data: { aktif: false } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete kategori" }, { status: 500 });
  }
}
