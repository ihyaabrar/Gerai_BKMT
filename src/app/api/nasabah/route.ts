import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth-middleware";
import {
  ValidationError,
  optionalBoolean,
  optionalString,
  requireNumber,
  requireString,
  toErrorResponse,
} from "@/lib/validate";
import type { Prisma } from "@prisma/client";
import { labelPeriode, periodeDari } from "@/lib/keuangan";
import { catatModal, modalBerlaku, periodePerubahan } from "@/lib/modal-nasabah";

export const dynamic = "force-dynamic";

/**
 * Persentase bagi hasil dihitung ulang untuk semua nasabah aktif.
 * Dijalankan di dalam transaksi supaya total persentase tidak pernah
 * terlihat setengah jadi oleh request lain.
 *
 * Kolom ini hanya untuk tampilan daftar. Distribusi menghitung porsinya
 * sendiri dari riwayat modal (lihat src/lib/modal-nasabah.ts).
 */
async function rebalancePersentase(tx: Prisma.TransactionClient) {
  const semua = await tx.nasabah.findMany({ where: { aktif: true } });
  const total = semua.reduce((sum, n) => sum + n.jumlahInvestasi, 0);

  for (const n of semua) {
    await tx.nasabah.update({
      where: { id: n.id },
      data: { persentase: total === 0 ? 0 : (n.jumlahInvestasi / total) * 100 },
    });
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const periodeIni = periodeDari(new Date());
    const nasabah = await prisma.nasabah.findMany({
      where: { aktif: true },
      orderBy: { nama: "asc" },
      include: { modal: { orderBy: { berlakuMulai: "asc" } } },
    });

    // Supaya pengurus bisa melihat kapan sebuah perubahan mulai dihitung:
    // modal yang berlaku bulan ini, dan perubahan yang menunggu bulan depan.
    return NextResponse.json(
      nasabah.map(({ modal, ...n }) => {
        const bulanIni = modalBerlaku(modal, periodeIni).get(n.id) ?? null;
        const tertunda = modal.filter((m) => m.berlakuMulai > periodeIni).at(-1) ?? null;
        return {
          ...n,
          modalBulanIni: bulanIni && bulanIni.aktif ? bulanIni.jumlah : 0,
          perubahanTertunda: tertunda
            ? {
                berlakuMulai: tertunda.berlakuMulai,
                label: labelPeriode(tertunda.berlakuMulai),
                jumlah: tertunda.jumlah,
                aktif: tertunda.aktif,
              }
            : null,
        };
      })
    );
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal memuat nasabah");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const nama = requireString(body?.nama, "Nama nasabah", { max: 150 });
    const jumlahInvestasi = requireNumber(body?.jumlahInvestasi, "Jumlah investasi", { min: 1 });
    const telepon = optionalString(body?.telepon, "Telepon", { max: 30 });
    const alamat = optionalString(body?.alamat, "Alamat", { max: 500 });
    const berlakuMulai = periodePerubahan();

    const nasabah = await prisma.$transaction(async (tx) => {
      const created = await tx.nasabah.create({
        data: { nama, telepon, alamat, jumlahInvestasi, persentase: 0 },
      });
      // Modalnya baru ikut dibagi mulai bulan depan.
      await catatModal(tx, {
        nasabahId: created.id,
        berlakuMulai,
        jumlah: jumlahInvestasi,
        aktif: true,
        dibuatOlehId: auth.user.id,
      });
      await rebalancePersentase(tx);
      // Baca ulang supaya persentase hasil rebalance ikut terkirim.
      return tx.nasabah.findUnique({ where: { id: created.id } });
    });

    return NextResponse.json({ ...nasabah, berlakuMulai, labelBerlaku: labelPeriode(berlakuMulai) });
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal menyimpan nasabah");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const id = requireString(body?.id, "ID nasabah");
    const nama = requireString(body?.nama, "Nama nasabah", { max: 150 });
    const jumlahInvestasi = requireNumber(body?.jumlahInvestasi, "Jumlah investasi", { min: 1 });
    const telepon = optionalString(body?.telepon, "Telepon", { max: 30 });
    const alamat = optionalString(body?.alamat, "Alamat", { max: 500 });
    // Koreksi salah ketik: nilai yang sudah tercatat diganti di tempat, jadi
    // ikut berlaku untuk bulan yang belum ditutup. Bukan untuk tambahan modal.
    const koreksi = optionalBoolean(body?.koreksi, false);

    const existing = await prisma.nasabah.findUnique({
      where: { id },
      include: { modal: { orderBy: { berlakuMulai: "desc" }, take: 1 } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Nasabah tidak ditemukan" }, { status: 404 });
    }

    const modalBerubah = jumlahInvestasi !== existing.jumlahInvestasi;
    const berlakuMulai = periodePerubahan();

    const nasabah = await prisma.$transaction(async (tx) => {
      await tx.nasabah.update({
        where: { id },
        data: { nama, telepon, alamat, jumlahInvestasi },
      });

      if (modalBerubah) {
        const terakhir = existing.modal[0];
        if (koreksi && terakhir) {
          await tx.modalNasabah.update({
            where: { id: terakhir.id },
            data: { jumlah: jumlahInvestasi, dibuatOlehId: auth.user.id },
          });
        } else {
          await catatModal(tx, {
            nasabahId: id,
            berlakuMulai,
            jumlah: jumlahInvestasi,
            aktif: true,
            dibuatOlehId: auth.user.id,
          });
        }
      }

      await rebalancePersentase(tx);
      return tx.nasabah.findUnique({ where: { id } });
    });

    return NextResponse.json({
      ...nasabah,
      modalBerubah,
      koreksi: modalBerubah && koreksi,
      berlakuMulai: modalBerubah && !koreksi ? berlakuMulai : null,
      labelBerlaku: modalBerubah && !koreksi ? labelPeriode(berlakuMulai) : null,
    });
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal memperbarui nasabah");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    const mode = searchParams.get("mode") === "salah-input" ? "salah-input" : "berhenti";

    const existing = await prisma.nasabah.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Nasabah tidak ditemukan" }, { status: 404 });
    }

    if (mode === "salah-input") {
      // Menghapus dari semua bulan yang belum ditutup hanya jujur untuk data
      // yang memang keliru dimasukkan. Nasabah yang pernah menerima bagian
      // adalah orang sungguhan dengan riwayat; ia berhenti, bukan "salah input".
      const pernahDibagi = await prisma.distribusiLabaNasabah.findFirst({
        where: { nasabahId: id },
        include: { distribusi: { select: { periode: true } } },
      });
      if (pernahDibagi) {
        throw new ValidationError(
          `${existing.nama} sudah tercatat menerima bagian ${labelPeriode(pernahDibagi.distribusi.periode)}, ` +
            `jadi tidak bisa dihapus sebagai salah input. Gunakan "Berhenti".`
        );
      }

      await prisma.$transaction(async (tx) => {
        await tx.modalNasabah.deleteMany({ where: { nasabahId: id } });
        await tx.nasabah.update({ where: { id }, data: { aktif: false } });
        await rebalancePersentase(tx);
      });

      return NextResponse.json({ success: true, mode, berlakuMulai: null });
    }

    // Berhenti: modalnya masih bekerja sampai hari ini, jadi masih ikut dibagi
    // bulan ini dan keluar mulai bulan depan.
    const berlakuMulai = periodePerubahan();
    await prisma.$transaction(async (tx) => {
      await catatModal(tx, {
        nasabahId: id,
        berlakuMulai,
        jumlah: existing.jumlahInvestasi,
        aktif: false,
        dibuatOlehId: auth.user.id,
      });
      await tx.nasabah.update({ where: { id }, data: { aktif: false } });
      await rebalancePersentase(tx);
    });

    return NextResponse.json({
      success: true,
      mode,
      berlakuMulai,
      labelBerlaku: labelPeriode(berlakuMulai),
    });
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal menghapus nasabah");
    return NextResponse.json({ error: message }, { status });
  }
}
