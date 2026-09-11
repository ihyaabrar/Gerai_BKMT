import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth, requireAuth } from "@/lib/auth-middleware";
import { STATUS_PENJUALAN, labelPeriode, periodeDari } from "@/lib/keuangan";
import {
  ValidationError,
  optionalString,
  parsePagination,
  requireInt,
  requireOneOf,
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

/**
 * Nomor transaksi: awalan, tanggal-jam yang bisa dibaca manusia, lalu empat
 * karakter acak.
 *
 * Versi sebelumnya hanya memakai dua digit acak (0–99) di belakang detik. Dua
 * kasir yang menekan Bayar pada detik yang sama punya sekitar 1% peluang
 * menghasilkan nomor yang sama, dan tabrakannya muncul sebagai "Gagal
 * memproses transaksi" — pesan yang tidak menjelaskan apa pun. Empat karakter
 * base36 memberi 1,7 juta kemungkinan per detik.
 */
function buatNomorTransaksi(prefix: string | undefined): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const acak = Math.floor(Math.random() * 36 ** 4)
    .toString(36)
    .toUpperCase()
    .padStart(4, "0");

  return (
    `${prefix || "TRX"}` +
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}` +
    acak
  );
}

/** Tabrakan pada kolom tertentu, supaya penanganannya bisa dibedakan. */
function tabrakanPada(error: unknown, kolom: string): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    ((error.meta?.target as string[] | undefined)?.includes(kolom) ?? false)
  );
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
        // Penjualan yang dibatalkan tetap ditampilkan di daftar — justru itu
        // gunanya: pengurus harus bisa melihat apa yang dibatalkan, oleh
        // siapa, dan dengan alasan apa.
        include: {
          member: true,
          detail: { include: { barang: true } },
          dibatalkanOleh: { select: { nama: true } },
        },
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
    const { message, status } = toErrorResponse(
      error,
      "Gagal memuat penjualan",
      { endpoint: "/api/penjualan", userId: auth.user?.id },
    );
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
      const qty = requireInt(item?.qty, "Jumlah barang", {
        min: 1,
        max: 100000,
      });
      requested.set(id, (requested.get(id) ?? 0) + qty);
    }

    const memberId = body?.memberId
      ? requireString(body.memberId, "Member")
      : null;
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

    const jalankanTransaksi = () =>
      prisma.$transaction(async (tx) => {
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
            throw new ValidationError(
              `Barang ${barang.nama} sudah tidak aktif`,
            );
          }
          if (barang.stok < qty) {
            throw new ValidationError(
              `Stok ${barang.nama} tidak mencukupi. Tersedia: ${barang.stok}`,
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
          const member = await tx.member.findUnique({
            where: { id: memberId },
          });
          if (!member || !member.aktif) {
            throw new ValidationError("Member tidak ditemukan");
          }
          persenDiskon = pengaturan?.diskonMember ?? 0;
        }

        const diskon = Math.round((subtotal * persenDiskon) / 100);
        const total = subtotal - diskon;

        if (bayar < total) {
          throw new ValidationError(
            `Jumlah bayar kurang dari total belanja (${total})`,
          );
        }

        const nomorTransaksi = buatNomorTransaksi(pengaturan?.prefixTransaksi);

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
          detail.map((d) => Prisma.sql`(${d.barangId}::text, ${d.qty}::int)`),
        )}) AS v(id, qty)
        WHERE b.id = v.id AND b.stok >= v.qty
      `;

        if (terpotong !== detail.length) {
          throw new ValidationError(
            "Stok berubah saat transaksi diproses. Periksa ulang keranjang.",
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

    // Nomor transaksi dibuat acak, jadi ada kemungkinan kecil bertabrakan
    // dengan transaksi lain pada detik yang sama. Itu bukan kesalahan kasir
    // dan tidak perlu sampai ke layarnya — cukup ulangi dengan nomor baru.
    let result;
    for (let percobaan = 1; ; percobaan++) {
      try {
        result = await jalankanTransaksi();
        break;
      } catch (error) {
        if (!tabrakanPada(error, "nomorTransaksi") || percobaan >= 3)
          throw error;
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    // Dua percobaan dengan kunci yang sama bisa tiba nyaris bersamaan dan
    // lolos dari pemeriksaan di awal. Yang kalah di constraint unik tidak
    // boleh dilaporkan sebagai kegagalan — transaksinya memang sudah ada.
    if (tabrakanPada(error, "idempotencyKey")) {
      const sudahAda = idempotencyKey
        ? await ambilPenjualan(idempotencyKey)
        : null;
      if (sudahAda) return NextResponse.json(sudahAda);
    }

    const { message, status } = toErrorResponse(
      error,
      "Gagal memproses transaksi",
      { endpoint: "/api/penjualan", userId: auth.user?.id },
    );
    return NextResponse.json({ error: message }, { status });
  }
}

/**
 * Membatalkan penjualan.
 *
 * Penjualan tidak pernah dihapus: struk yang sudah dicetak tetap ada di dunia
 * nyata, dan pertanyaan tentangnya akan muncul lagi kemudian. Pembatalan
 * mengembalikan stok, menarik kembali poin member, dan meninggalkan jejak
 * siapa membatalkan, kapan, dan kenapa.
 */
export async function PATCH(request: NextRequest) {
  // Kasir yang salah input memanggil pengelola. Membatalkan penjualan
  // mengubah uang dan stok sekaligus, jadi bukan wewenang kasir.
  const auth = await requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const id = requireString(body?.id, "ID penjualan");
    requireOneOf(body?.aksi, "Aksi", ["batal"] as const);
    const alasan = requireString(body?.alasan, "Alasan pembatalan", {
      min: 5,
      max: 300,
    });

    const hasil = await prisma.$transaction(async (tx) => {
      const penjualan = await tx.penjualan.findUnique({
        where: { id },
        include: { detail: true },
      });

      if (!penjualan) {
        throw new ValidationError("Penjualan tidak ditemukan");
      }
      if (penjualan.status === STATUS_PENJUALAN.batal) {
        throw new ValidationError("Penjualan ini sudah dibatalkan sebelumnya");
      }

      // Periode yang distribusinya sudah ditutup tidak boleh berubah diam-diam:
      // bagi hasil bulan itu sudah dihitung, mungkin sudah dibayarkan, dan
      // angkanya sudah dipertanggungjawabkan ke anggota.
      const periode = periodeDari(penjualan.tanggal);
      const distribusi = await tx.distribusiLaba.findUnique({
        where: { periode },
      });
      if (distribusi) {
        throw new ValidationError(
          `Distribusi ${labelPeriode(periode)} sudah ditutup, jadi transaksi bulan itu tidak bisa diubah. ` +
            `Buka kembali periodenya lebih dulu (hanya master), lalu tutup ulang setelah pembatalan.`,
        );
      }

      // Stok dikembalikan dalam satu perintah, sejalan dengan cara
      // pemotongannya saat penjualan dibuat.
      if (penjualan.detail.length > 0) {
        await tx.$executeRaw`
          UPDATE "Barang" AS b
          SET stok = b.stok + v.qty
          FROM (VALUES ${Prisma.join(
            penjualan.detail.map(
              (d) => Prisma.sql`(${d.barangId}::text, ${d.qty}::int)`,
            ),
          )}) AS v(id, qty)
          WHERE b.id = v.id
        `;
      }

      // Poin member ditarik kembali sebanyak yang dulu diberikan, tidak sampai
      // membuat saldo poin negatif.
      if (penjualan.memberId) {
        const poin = Math.floor(penjualan.total / 1000);
        if (poin > 0) {
          const member = await tx.member.findUnique({
            where: { id: penjualan.memberId },
            select: { poin: true },
          });
          if (member) {
            await tx.member.update({
              where: { id: penjualan.memberId },
              data: { poin: Math.max(0, member.poin - poin) },
            });
          }
        }
      }

      return tx.penjualan.update({
        where: { id },
        data: {
          status: STATUS_PENJUALAN.batal,
          alasanBatal: alasan,
          dibatalkanPada: new Date(),
          dibatalkanOlehId: auth.user.id,
        },
        include: {
          ...SERTAKAN,
          dibatalkanOleh: { select: { nama: true } },
        },
      });
    }, TRANSAKSI_OPSI);

    return NextResponse.json(hasil);
  } catch (error) {
    const { message, status } = toErrorResponse(
      error,
      "Gagal membatalkan penjualan",
      { endpoint: "/api/penjualan", userId: auth.user?.id },
    );
    return NextResponse.json({ error: message }, { status });
  }
}
