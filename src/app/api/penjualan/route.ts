import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const penjualan = await prisma.penjualan.findMany({
      include: { member: true, detail: { include: { barang: true } } },
      orderBy: { tanggal: "desc" },
    });
    return NextResponse.json(penjualan);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch penjualan" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, memberId, subtotal, diskon, total, bayar, kembalian, metodeBayar } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Keranjang kosong" }, { status: 400 });
    }
    if (typeof bayar !== "number" || bayar < total) {
      return NextResponse.json({ error: "Jumlah bayar tidak valid atau kurang dari total" }, { status: 400 });
    }

    // Validasi & lock stok semua item sebelum transaksi
    for (const item of items) {
      const barang = await prisma.barang.findUnique({ where: { id: item.id } });
      if (!barang) {
        return NextResponse.json({ error: `Barang tidak ditemukan: ${item.nama}` }, { status: 400 });
      }
      if (barang.stok < item.qty) {
        return NextResponse.json(
          { error: `Stok ${barang.nama} tidak mencukupi. Tersedia: ${barang.stok}` },
          { status: 400 }
        );
      }
    }

    // Generate nomor transaksi unik: PREFIX + tanggal + detik + random 2 digit
    const now = new Date();
    const pad = (n: number, len = 2) => String(n).padStart(len, "0");
    const pengaturan = await prisma.pengaturan.findFirst();
    const prefix = pengaturan?.prefixTransaksi || "TRX";
    const nomorFinal = `${prefix}${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}${pad(Math.floor(Math.random() * 100))}`;

    const penjualan = await prisma.penjualan.create({
      data: {
        nomorTransaksi: nomorFinal,
        memberId: memberId || null,
        subtotal,
        diskon,
        total,
        bayar,
        kembalian,
        metodeBayar,
        detail: {
          create: items.map((item: any) => ({
            barangId: item.id,
            qty: item.qty,
            hargaJual: item.hargaJual,
            subtotal: item.hargaJual * item.qty,
          })),
        },
      },
    });

    // Kurangi stok
    for (const item of items) {
      await prisma.barang.update({
        where: { id: item.id },
        data: { stok: { decrement: item.qty } },
      });
    }

    // Tambah poin member (1 poin per 1000 rupiah)
    if (memberId) {
      const poin = Math.floor(total / 1000);
      if (poin > 0) {
        await prisma.member.update({
          where: { id: memberId },
          data: { poin: { increment: poin } },
        });
      }
    }

    return NextResponse.json(penjualan);
  } catch (error) {
    console.error("Penjualan error:", error);
    return NextResponse.json({ error: "Gagal memproses transaksi" }, { status: 500 });
  }
}
