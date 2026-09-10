import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-middleware";
import {
  ValidationError,
  parsePagination,
  requireInt,
  requireString,
  toErrorResponse,
} from "@/lib/validate";

export const dynamic = "force-dynamic";

const METODE_BAYAR = ["Tunai", "Transfer", "QRIS", "Debit"] as const;

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search")?.trim();

    const where: any = {};
    if (startDate && endDate) {
      where.tanggal = { gte: new Date(startDate), lte: new Date(endDate) };
    }
    if (search) {
      where.nomorTransaksi = { contains: search, mode: "insensitive" };
    }

    const [data, total] = await Promise.all([
      prisma.penjualan.findMany({
        where,
        include: { member: true, detail: { include: { barang: true } } },
        orderBy: { tanggal: "desc" },
        skip,
        take: limit,
      }),
      prisma.penjualan.count({ where }),
    ]);

    return NextResponse.json({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal memuat penjualan");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();

    if (!Array.isArray(body?.items) || body.items.length === 0) {
      throw new ValidationError("Keranjang kosong");
    }
    if (body.items.length > 200) {
      throw new ValidationError("Terlalu banyak item dalam satu transaksi");
    }

    // Gabungkan item duplikat supaya qty per barang dihitung sekali.
    const requested = new Map<string, number>();
    for (const item of body.items) {
      const id = requireString(item?.id, "ID barang");
      const qty = requireInt(item?.qty, "Jumlah barang", { min: 1, max: 100000 });
      requested.set(id, (requested.get(id) ?? 0) + qty);
    }

    const memberId = body?.memberId ? requireString(body.memberId, "Member") : null;
    const metodeBayar = METODE_BAYAR.includes(body?.metodeBayar)
      ? body.metodeBayar
      : "Tunai";
    const bayar = requireInt(body?.bayar, "Jumlah bayar", { min: 0 });

    const result = await prisma.$transaction(async (tx) => {
      const barangList = await tx.barang.findMany({
        where: { id: { in: [...requested.keys()] } },
      });

      if (barangList.length !== requested.size) {
        throw new ValidationError("Ada barang yang tidak ditemukan");
      }

      // Harga dan subtotal dihitung ulang dari database.
      // Nilai dari client hanya dipakai untuk tampilan, tidak pernah dipercaya.
      let subtotal = 0;
      const detail: {
        barangId: string;
        qty: number;
        hargaJual: number;
        subtotal: number;
      }[] = [];

      for (const barang of barangList) {
        const qty = requested.get(barang.id)!;
        if (!barang.aktif) {
          throw new ValidationError(`Barang ${barang.nama} sudah tidak aktif`);
        }
        if (barang.stok < qty) {
          throw new ValidationError(
            `Stok ${barang.nama} tidak mencukupi. Tersedia: ${barang.stok}`
          );
        }
        const itemSubtotal = barang.hargaJual * qty;
        subtotal += itemSubtotal;
        detail.push({
          barangId: barang.id,
          qty,
          hargaJual: barang.hargaJual,
          subtotal: itemSubtotal,
        });
      }

      const pengaturan = await tx.pengaturan.findFirst();

      // Persen diskon juga diambil dari pengaturan server, bukan dari client.
      let persenDiskon = 0;
      if (memberId) {
        const member = await tx.member.findUnique({ where: { id: memberId } });
        if (!member || !member.aktif) {
          throw new ValidationError("Member tidak ditemukan");
        }
        persenDiskon = pengaturan?.diskonMember ?? 0;
      }

      const diskon = Math.round((subtotal * persenDiskon) / 100);
      const total = subtotal - diskon;

      if (bayar < total) {
        throw new ValidationError(
          `Jumlah bayar kurang dari total belanja (${total})`
        );
      }

      const shiftAktif = await tx.shiftKasir.findFirst({
        where: { jamTutup: null },
        orderBy: { jamBuka: "desc" },
      });

      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const prefix = pengaturan?.prefixTransaksi || "TRX";
      const nomorTransaksi = `${prefix}${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
        now.getDate()
      )}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}${pad(
        Math.floor(Math.random() * 100)
      )}`;

      const penjualan = await tx.penjualan.create({
        data: {
          nomorTransaksi,
          memberId,
          subtotal,
          diskon,
          total,
          bayar,
          kembalian: bayar - total,
          metodeBayar,
          // Menghubungkan transaksi ke shift aktif — sebelumnya selalu null
          // sehingga total penjualan per shift selalu 0.
          shiftId: shiftAktif?.id ?? null,
          detail: { create: detail },
        },
        include: { detail: { include: { barang: true } }, member: true },
      });

      // Pengurangan stok berada dalam transaksi yang sama dengan pembuatan
      // penjualan, jadi tidak mungkin lagi ada penjualan tanpa potong stok.
      for (const item of detail) {
        await tx.barang.update({
          where: { id: item.barangId },
          data: { stok: { decrement: item.qty } },
        });
      }

      if (memberId) {
        const poin = Math.floor(total / 1000);
        if (poin > 0) {
          await tx.member.update({
            where: { id: memberId },
            data: { poin: { increment: poin } },
          });
        }
      }

      return penjualan;
    });

    return NextResponse.json(result);
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal memproses transaksi");
    return NextResponse.json({ error: message }, { status });
  }
}
