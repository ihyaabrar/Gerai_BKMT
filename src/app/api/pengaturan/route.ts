import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth, requireAuth } from "@/lib/auth-middleware";
import {
  ValidationError,
  optionalString,
  requireNumber,
  requireString,
  toErrorResponse,
} from "@/lib/validate";
import { periodeYangHarusDitutup, pesanTerkunci } from "@/lib/penguncian";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Kasir juga perlu membaca nama toko & diskon member untuk struk.
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  try {
    let pengaturan = await prisma.pengaturan.findFirst();
    if (!pengaturan) {
      pengaturan = await prisma.pengaturan.create({ data: {} });
    }
    return NextResponse.json(pengaturan);
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal memuat pengaturan");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  // Mengubah pengaturan (termasuk persen bagi hasil) hanya master/admin.
  const auth = await requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();

    const data: Record<string, unknown> = {
      namaToko: requireString(body?.namaToko, "Nama toko", { max: 150 }),
      alamatToko: optionalString(body?.alamatToko, "Alamat toko", { max: 500 }),
      teleponToko: optionalString(body?.teleponToko, "Telepon toko", { max: 30 }),
      prefixTransaksi: requireString(body?.prefixTransaksi, "Prefix transaksi", { max: 10 }),
      diskonMember: requireNumber(body?.diskonMember, "Diskon member", { min: 0, max: 100 }),
      persenNasabah: requireNumber(body?.persenNasabah, "Persentase nasabah", { min: 0, max: 100 }),
      persenPengelola: requireNumber(body?.persenPengelola, "Persentase pengelola", {
        min: 0,
        max: 100,
      }),
    };

    // Bagi hasil harus tepat 100%. Pembulatan sebelumnya meloloskan 30,4 + 70,
    // sehingga label menulis "Pengelola 70%" padahal yang diterima 69,6%.
    const totalBagiHasil =
      (data.persenNasabah as number) + (data.persenPengelola as number);
    if (Math.abs(totalBagiHasil - 100) > 1e-9) {
      throw new ValidationError(
        `Persentase nasabah + pengelola harus 100% (saat ini ${totalBagiHasil}%)`
      );
    }

    const existing = await prisma.pengaturan.findFirst();

    // Persentase bagi hasil tidak boleh berubah di antara akhir bulan dan
    // penutupan distribusinya — persentase baru akan berlaku surut.
    const persenBerubah =
      !existing ||
      existing.persenNasabah !== data.persenNasabah ||
      existing.persenPengelola !== data.persenPengelola;
    if (persenBerubah) {
      const terkunci = await periodeYangHarusDitutup();
      if (terkunci) {
        return NextResponse.json(
          { error: pesanTerkunci(terkunci, "mengubah persentase bagi hasil") },
          { status: 409 }
        );
      }
    }

    const pengaturan = existing
      ? await prisma.pengaturan.update({ where: { id: existing.id }, data: data as any })
      : await prisma.pengaturan.create({ data: data as any });

    return NextResponse.json(pengaturan);
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal menyimpan pengaturan");
    return NextResponse.json({ error: message }, { status });
  }
}
