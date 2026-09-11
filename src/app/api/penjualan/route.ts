import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-middleware";
import {
  ValidationError,
  optionalString,
  parsePagination,
  requireInt,
  requireString,
  toErrorResponse,
} from "@/lib/validate";

export const dynamic = "force-dynamic";

const METODE_BAYAR = ["Tunai", "Transfer", "QRIS", "Debit"] as const;

/**
 * Batas bawaan Prisma 5 detik terlalu ketat untuk transaksi belanjaan besar
 * di jaringan kabupaten, dan transaksi yang kehabisan waktu justru memicu
 * percobaan ulang — persis kejadian yang ingin dihindari.
 */
const TRANSAKSI_OPSI = { timeout: 15_000, maxWait: 5_000 } as const;

const SERTAKAN = {
  detail: { include: { barang: true } },
  member: true,
} as const;

function ambilPenjualan(idempotencyKey: string) {
  return prisma.penjualan.findUnique({
    where: { idempotencyKey },
    include: SERTAKAN,
  });
}

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

  // Disimpan di luar try supaya blok catch bisa mengenali tabrakan kunci.
  let idempotencyKey: string | null = null;

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
    idempotencyKey = optionalString(body?.idempotencyKey, "Kunci transaksi", {
      max: 64,
    });

    // Kasir yang koneksinya terputus tidak bisa membedakan "transaksi gagal"
    // dari "transaksi berhasil tapi responsnya hilang di jalan", jadi ia akan
    // menekan Bayar lagi. Kalau kunci ini sudah pernah dipakai, transaksi yang
    // sama dikembalikan alih-alih dibuat dua kali.
    if (idempotencyKey) {
      const sudahAda = await ambilPenjualan(idempotencyKey);
      if (sudahAda) return NextResponse.json(sudahAda);
    }

    // Dua pembacaan ini tidak butuh isolasi transaksi, jadi dikeluarkan.
    // Setiap round-trip di dalam transaksi ikut memakan anggaran waktunya.
    const [pengaturan, shiftAktif] = await Promise.all([
      prisma.pengaturan.findFirst(),
      prisma.shiftKasir.findFirst({
        where: { jamTutup: null },
        orderBy: { jamBuka: "desc" },
        select: { id: true },
      }),
    ]);

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
        hargaBeli: number;
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
          // Harga pokok ikut dibekukan di sini. Kalau nanti harga beli barang
          // diubah, laba bulan ini tetap seperti yang dilaporkan hari ini.
          hargaBeli: barang.hargaBeli,
          subtotal: itemSubtotal,
        });
      }

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
          idempotencyKey,
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
          // Siapa yang melayani transaksi ini. Tanpa kolom ini, selisih kas
          // tidak bisa ditelusuri ke siapa pun.
          userId: auth.user.id,
          detail: { create: detail },
        },
        include: SERTAKAN,
      });

      // Seluruh stok dipotong dalam SATU perintah, bukan satu per barang.
      // Belanjaan 12 item sebelumnya berarti 12 round-trip berurutan di dalam
      // transaksi — cukup untuk melewati batas waktunya pada jaringan lambat.
      //
      // Syarat `b.stok >= v.qty` membuat pemotongan ini sekaligus jadi
      // penjagaan: pemeriksaan stok di atas dan pemotongan di sini terpisah
      // waktunya, jadi dua kasir yang menjual barang terakhir bersamaan bisa
      // lolos keduanya. Kalau ada baris yang tidak memenuhi syarat, jumlah
      // baris terupdate berkurang dan seluruh transaksi dibatalkan.
      const terpotong = await tx.$executeRaw`
        UPDATE "Barang" AS b
        SET stok = b.stok - v.qty
        FROM (VALUES ${Prisma.join(
          detail.map((d) => Prisma.sql`(${d.barangId}::text, ${d.qty}::int)`)
        )}) AS v(id, qty)
        WHERE b.id = v.id AND b.stok >= v.qty
      `;

      if (terpotong !== detail.length) {
        throw new ValidationError(
          "Stok berubah saat transaksi diproses. Periksa ulang keranjang."
        );
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
    }, TRANSAKSI_OPSI);

    return NextResponse.json(result);
  } catch (error) {
    // Dua percobaan dengan kunci yang sama bisa tiba nyaris bersamaan dan
    // lolos dari pemeriksaan di awal. Yang kalah di constraint unik tidak
    // boleh dilaporkan sebagai kegagalan — transaksinya memang sudah ada.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002" &&
      (error.meta?.target as string[] | undefined)?.includes("idempotencyKey")
    ) {
      const sudahAda = idempotencyKey ? await ambilPenjualan(idempotencyKey) : null;
      if (sudahAda) return NextResponse.json(sudahAda);
    }

    const { message, status } = toErrorResponse(error, "Gagal memproses transaksi");
    return NextResponse.json({ error: message }, { status });
  }
}
