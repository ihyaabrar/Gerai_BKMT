import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateKode } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const penjualan = await prisma.penjualan.findMany({
    include: { member: true, detail: { include: { barang: true } } },
    orderBy: { tanggal: "desc" },
  });
  return NextResponse.json(penjualan);
}

export async function POST(request: Request) {
  const body = await request.json();
  
  const lastPenjualan = await prisma.penjualan.findFirst({
    orderBy: { createdAt: "desc" },
  });
  
  const lastNumber = lastPenjualan
    ? parseInt(lastPenjualan.nomorTransaksi.replace(/\D/g, ""))
    : 0;
  
  const nomorTransaksi = generateKode("TRX", lastNumber);

  const penjualan = await prisma.penjualan.create({
    data: {
      nomorTransaksi,
      memberId: body.memberId,
      subtotal: body.subtotal,
      diskon: body.diskon,
      total: body.total,
      bayar: body.bayar,
      kembalian: body.kembalian,
      metodeBayar: body.metodeBayar,
      detail: {
        create: body.items.map((item: any) => ({
          barangId: item.id,
          qty: item.qty,
          hargaJual: item.hargaJual,
          subtotal: item.subtotal,
        })),
      },
    },
  });

  for (const item of body.items) {
    await prisma.barang.update({
      where: { id: item.id },
      data: { stok: { decrement: item.qty } },
    });
  }

  return NextResponse.json(penjualan);
}
