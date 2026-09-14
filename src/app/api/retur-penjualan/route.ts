import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth-middleware";
import { STATUS_PENJUALAN, refundBaris, stempelWIB } from "@/lib/keuangan";
import {
  ValidationError,
  optionalBoolean,
  requireInt,
  requireString,
  toErrorResponse,
} from "@/lib/validate";
import { formatRupiah } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TRANSAKSI_OPSI = { timeout: 15_000, maxWait: 5_000 } as const;

interface PermintaanRetur {
  detailPenjualanId: string;
  qty: number;
  kembaliKeStok: boolean;
}

function buatNomorRetur(): string {
  const acak = Math.floor(Math.random() * 36 ** 4)
    .toString(36)
    .toUpperCase()
    .padStart(4, "0");
  return `RTR${stempelWIB(new Date())}${acak}`;
}

/** Jumlah per baris penjualan yang masih bisa diretur. */
function sisaPerBaris(
  detail: { id: string; qty: number }[],
  sudahRetur: { detailPenjualanId: string; qty: number }[]
): Map<string, number> {
  const sisa = new Map(detail.map((d) => [d.id, d.qty]));
  for (const r of sudahRetur) {
    sisa.set(r.detailPenjualanId, (sisa.get(r.detailPenjualanId) ?? 0) - r.qty);
  }
  return sisa;
}

/**
 * GET ?penjualanId=… → rincian penjualan beserta sisa yang bisa diretur dan
 * riwayat returnya. Tanpa parameter → retur terbaru.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const penjualanId = new URL(request.url).searchParams.get("penjualanId");

    if (!penjualanId) {
      const retur = await prisma.returPenjualan.findMany({
        orderBy: { tanggal: "desc" },
        take: 100,
        include: {
          penjualan: { select: { nomorTransaksi: true } },
          user: { select: { nama: true } },
          detail: { include: { barang: { select: { nama: true } } } },
        },
      });
      return NextResponse.json(retur);
    }

    const penjualan = await prisma.penjualan.findUnique({
      where: { id: penjualanId },
      include: {
        detail: { include: { barang: { select: { nama: true, satuan: true } } } },
        member: { select: { nama: true } },
        retur: {
          orderBy: { tanggal: "desc" },
          include: {
            user: { select: { nama: true } },
            detail: { include: { barang: { select: { nama: true } } } },
          },
        },
      },
    });
    if (!penjualan) {
      return NextResponse.json({ error: "Penjualan tidak ditemukan" }, { status: 404 });
    }

    const sisa = sisaPerBaris(
      penjualan.detail,
      penjualan.retur.flatMap((r) => r.detail)
    );

    return NextResponse.json({
      ...penjualan,
      detail: penjualan.detail.map((d) => ({
        ...d,
        sisaBisaRetur: sisa.get(d.id) ?? 0,
        refundPerUnit: refundBaris(d.hargaJual, 1, penjualan.subtotal, penjualan.total),
      })),
    });
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal memuat retur", {
      endpoint: "/api/retur-penjualan",
      userId: auth.user?.id,
    });
    return NextResponse.json({ error: message }, { status });
  }
}

/**
 * Mencatat retur pembeli.
 *
 * Body: { penjualanId, alasan, items: [{ detailPenjualanId, qty, kembaliKeStok }] }
 *
 * - Uang kembali per barang mengikuti diskon transaksi (refundBaris).
 * - Barang yang kembali ke rak menambah stok dan mengembalikan harga pokoknya;
 *   barang rusak tidak.
 * - Poin member ditarik sebanding uang yang dikembalikan.
 * - Refund tunai tercatat pada shift yang sedang buka.
 * - Retur dihitung pada bulan retur terjadi — distribusi bulan penjualan yang
 *   sudah ditutup tidak berubah dan tidak perlu dibuka kembali.
 */
export async function POST(request: NextRequest) {
  // Mengembalikan uang adalah wewenang pengelola, sama seperti pembatalan.
  const auth = await requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const penjualanId = requireString(body?.penjualanId, "Penjualan");
    const alasan = requireString(body?.alasan, "Alasan retur", { min: 5, max: 300 });

    if (!Array.isArray(body?.items) || body.items.length === 0) {
      throw new ValidationError("Pilih minimal satu barang yang dikembalikan");
    }
    const permintaan: PermintaanRetur[] = body.items.map((it: Record<string, unknown>, i: number) => ({
      detailPenjualanId: requireString(it?.detailPenjualanId, `Barang ke-${i + 1}`),
      qty: requireInt(it?.qty, `Jumlah barang ke-${i + 1}`, { min: 1, max: 100_000 }),
      kembaliKeStok: optionalBoolean(it?.kembaliKeStok, true),
    }));
    const unik = new Set(permintaan.map((p) => p.detailPenjualanId));
    if (unik.size !== permintaan.length) {
      throw new ValidationError("Barang yang sama tercantum dua kali");
    }

    const hasil = await prisma.$transaction(async (tx) => {
      // Dua pengelola yang meretur transaksi yang sama bersamaan tidak boleh
      // sama-sama lolos pemeriksaan sisa jumlah.
      await tx.$queryRaw`SELECT "id" FROM "Penjualan" WHERE "id" = ${penjualanId} FOR UPDATE`;

      const penjualan = await tx.penjualan.findUnique({
        where: { id: penjualanId },
        include: {
          detail: { include: { barang: { select: { nama: true } } } },
          retur: { include: { detail: true } },
        },
      });
      if (!penjualan) throw new ValidationError("Penjualan tidak ditemukan");
      if (penjualan.status === STATUS_PENJUALAN.batal) {
        throw new ValidationError("Penjualan ini sudah dibatalkan, jadi tidak bisa diretur");
      }

      const sisa = sisaPerBaris(penjualan.detail, penjualan.retur.flatMap((r) => r.detail));
      const barisPenjualan = new Map(penjualan.detail.map((d) => [d.id, d]));

      const baris = permintaan.map((p) => {
        const d = barisPenjualan.get(p.detailPenjualanId);
        if (!d) throw new ValidationError("Barang tidak ada di transaksi ini");
        const bisa = sisa.get(d.id) ?? 0;
        if (p.qty > bisa) {
          throw new ValidationError(
            bisa <= 0
              ? `${d.barang.nama} sudah diretur seluruhnya`
              : `${d.barang.nama}: hanya ${bisa} yang masih bisa diretur`
          );
        }
        return {
          detail: d,
          qty: p.qty,
          kembaliKeStok: p.kembaliKeStok,
          refund: refundBaris(d.hargaJual, p.qty, penjualan.subtotal, penjualan.total),
        };
      });

      // Pembulatan per baris tidak boleh membuat total uang kembali melebihi
      // yang pernah dibayar pembeli.
      const sudahDikembalikan = penjualan.retur.reduce((s, r) => s + r.totalRefund, 0);
      let totalRefund = baris.reduce((s, b) => s + b.refund, 0);
      const batas = Math.round(penjualan.total - sudahDikembalikan);
      if (totalRefund > batas) {
        const selisih = totalRefund - batas;
        const terbesar = baris.reduce((a, b) => (b.refund > a.refund ? b : a));
        terbesar.refund -= selisih;
        totalRefund = batas;
      }

      const kembaliRak = baris.filter((b) => b.kembaliKeStok);
      const hppKembali = kembaliRak.reduce((s, b) => s + b.detail.hargaBeli * b.qty, 0);
      if (kembaliRak.length > 0) {
        await tx.$executeRaw`
          UPDATE "Barang" AS b
          SET stok = b.stok + v.qty
          FROM (VALUES ${Prisma.join(
            kembaliRak.map((b) => Prisma.sql`(${b.detail.barangId}::text, ${b.qty}::int)`)
          )}) AS v(id, qty)
          WHERE b.id = v.id
        `;
      }

      if (penjualan.memberId) {
        const poin = Math.floor(totalRefund / 1000);
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

      const shiftAktif = await tx.shiftKasir.findFirst({
        where: { jamTutup: null },
        orderBy: { jamBuka: "desc" },
        select: { id: true },
      });

      return tx.returPenjualan.create({
        data: {
          nomor: buatNomorRetur(),
          penjualanId,
          alasan,
          totalRefund,
          hppKembali,
          metodeRefund: penjualan.metodeBayar,
          shiftId: shiftAktif?.id ?? null,
          userId: auth.user.id,
          detail: {
            create: baris.map((b) => ({
              detailPenjualanId: b.detail.id,
              barangId: b.detail.barangId,
              qty: b.qty,
              refund: b.refund,
              hargaBeli: b.detail.hargaBeli,
              kembaliKeStok: b.kembaliKeStok,
            })),
          },
        },
        include: { detail: { include: { barang: { select: { nama: true } } } } },
      });
    }, TRANSAKSI_OPSI);

    return NextResponse.json({
      ...hasil,
      pesan:
        `Retur ${hasil.nomor} tercatat. Kembalikan ${formatRupiah(hasil.totalRefund)} ` +
        (hasil.metodeRefund === "Tunai" ? "tunai dari laci." : `lewat ${hasil.metodeRefund}.`),
    });
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal mencatat retur", {
      endpoint: "/api/retur-penjualan",
      userId: auth.user?.id,
    });
    return NextResponse.json({ error: message }, { status });
  }
}
