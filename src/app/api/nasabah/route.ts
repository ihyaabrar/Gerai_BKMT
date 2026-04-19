import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Helper: hitung ulang persentase semua nasabah aktif
async function rebalancePersentase() {
  const semua = await prisma.nasabah.findMany({ where: { aktif: true } });
  const total = semua.reduce((sum, n) => sum + n.jumlahInvestasi, 0);
  if (total === 0) return;
  await Promise.all(
    semua.map((n) =>
      prisma.nasabah.update({
        where: { id: n.id },
        data: { persentase: (n.jumlahInvestasi / total) * 100 },
      })
    )
  );
}

export async function GET() {
  const nasabah = await prisma.nasabah.findMany({
    where: { aktif: true },
    orderBy: { nama: "asc" },
  });
  return NextResponse.json(nasabah);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nama, telepon, alamat, jumlahInvestasi } = body;

    if (!nama || !jumlahInvestasi) {
      return NextResponse.json({ error: "Nama dan jumlah investasi wajib diisi" }, { status: 400 });
    }

    // Buat nasabah dulu dengan persentase sementara
    await prisma.nasabah.create({
      data: {
        nama,
        telepon: telepon || null,
        alamat: alamat || null,
        jumlahInvestasi: parseFloat(jumlahInvestasi),
        persentase: 0,
      },
    });

    // Hitung ulang semua persentase
    await rebalancePersentase();

    const nasabah = await prisma.nasabah.findMany({
      where: { aktif: true },
      orderBy: { nama: "asc" },
    });
    return NextResponse.json(nasabah[nasabah.length - 1]);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create nasabah" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, nama, telepon, alamat, jumlahInvestasi } = body;

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.nasabah.update({
      where: { id },
      data: {
        nama,
        telepon: telepon || null,
        alamat: alamat || null,
        jumlahInvestasi: parseFloat(jumlahInvestasi),
      },
    });

    // Hitung ulang semua persentase
    await rebalancePersentase();

    const nasabah = await prisma.nasabah.findUnique({ where: { id } });
    return NextResponse.json(nasabah);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update nasabah" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.nasabah.update({ where: { id }, data: { aktif: false } });

    // Hitung ulang persentase nasabah yang tersisa
    await rebalancePersentase();

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete nasabah" }, { status: 500 });
  }
}
