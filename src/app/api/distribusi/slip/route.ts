import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth-middleware";
import { labelPeriode, periodeValid } from "@/lib/keuangan";
import { ValidationError, toErrorResponse } from "@/lib/validate";
import type { DataSlip, OrganisasiSlip } from "@/lib/slip";

export const dynamic = "force-dynamic";

/** Isian contoh dari seed lama tidak boleh tercetak di slip nasabah. */
const ISIAN_CONTOH = new Set(["Jl. Contoh No. 123", "081234567890"]);
const bersih = (s: string | null | undefined) => {
  const t = (s ?? "").trim();
  return ISIAN_CONTOH.has(t) ? "" : t;
};

/**
 * GET ?periode=YYYY-MM → data slip seluruh nasabah pada periode yang sudah
 * ditutup. Periode yang masih pratinjau ditolak: angkanya masih bisa berubah,
 * dan slip yang sudah diberikan ke nasabah tidak bisa ditarik kembali.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const periode = new URL(request.url).searchParams.get("periode");
    if (!periodeValid(periode)) {
      throw new ValidationError("Periode harus berformat YYYY-MM, misalnya 2026-09");
    }

    const [distribusi, pengaturan, profil] = await Promise.all([
      prisma.distribusiLaba.findUnique({
        where: { periode },
        include: {
          dibuatOleh: { select: { nama: true } },
          detail: {
            orderBy: { namaNasabah: "asc" },
            include: { nasabah: { select: { telepon: true } } },
          },
        },
      }),
      prisma.pengaturan.findFirst(),
      prisma.profilOrganisasi.findFirst({ select: { nama: true, singkatan: true } }),
    ]);

    if (!distribusi) {
      throw new ValidationError(
        `Distribusi ${labelPeriode(periode)} belum ditutup. Slip hanya bisa dibuat setelah periode ditutup.`
      );
    }

    const organisasi: OrganisasiSlip = {
      namaGerai: bersih(pengaturan?.namaToko) || "Gerai BKMT",
      namaOrganisasi: bersih(profil?.singkatan) || bersih(profil?.nama),
      alamat: bersih(pengaturan?.alamatToko),
      telepon: bersih(pengaturan?.teleponToko),
    };

    const slips: DataSlip[] = distribusi.detail.map((d) => ({
      periode,
      label: labelPeriode(periode),
      ditutupPada: distribusi.createdAt.toISOString(),
      ditutupOleh: distribusi.dibuatOleh?.nama ?? null,
      totalPenjualan: distribusi.totalPenjualan,
      totalHpp: distribusi.totalHpp,
      totalRetur: distribusi.totalRetur,
      hppRetur: distribusi.hppRetur,
      labaKotor: distribusi.labaKotor,
      kerugianStok: distribusi.kerugianStok,
      persenNasabah: distribusi.persenNasabah,
      bagianNasabah: distribusi.bagianNasabah,
      totalInvestasi: distribusi.totalInvestasi,
      nasabah: {
        nasabahId: d.nasabahId,
        // Nama dari rekaman, bukan data nasabah hari ini.
        nama: d.namaNasabah,
        telepon: d.nasabah?.telepon ?? null,
        jumlahInvestasi: d.jumlahInvestasi,
        persentase: d.persentase,
        bagian: d.bagian,
      },
    }));

    return NextResponse.json({ organisasi, slips });
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal memuat slip", {
      endpoint: "/api/distribusi/slip",
      userId: auth.user?.id,
    });
    return NextResponse.json({ error: message }, { status });
  }
}
