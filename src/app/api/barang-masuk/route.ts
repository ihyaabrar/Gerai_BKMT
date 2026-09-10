import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-middleware";
import {
  ValidationError,
  optionalBoolean,
  optionalString,
  requireInt,
  requireNumber,
  requireString,
  toErrorResponse,
} from "@/lib/validate";
import { formatRupiah } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Pencatatan barang masuk: menambah stok DAN mencatat pengeluaran
 * pembelian dalam satu transaksi.
 *
 * Sebelumnya halaman barang masuk memanggil dua endpoint terpisah
 * (PATCH /api/barang lalu POST /api/pengeluaran). Kalau langkah kedua gagal,
 * stok sudah bertambah tanpa pernah tercatat sebagai pengeluaran — dan
 * stoknya di-set absolut dari angka lama di browser, sehingga transaksi
 * kasir yang terjadi bersamaan ikut tertimpa.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const mode = body?.mode === "baru" ? "baru" : "existing";

    const hasil = await prisma.$transaction(async (tx) => {
      if (mode === "baru") {
        const kode = requireString(body?.kode, "Kode barang", { max: 50 });
        const nama = requireString(body?.nama, "Nama barang", { max: 150 });
        const hargaBeli = requireNumber(body?.hargaBeli, "Harga beli", { min: 0 });
        const hargaJual = requireNumber(body?.hargaJual, "Harga jual", { min: 0 });
        const stok = requireInt(body?.stok, "Stok awal", { min: 0 });
        const stokMinimum = requireInt(body?.stokMinimum ?? 5, "Stok minimum", { min: 0 });
        const satuan = optionalString(body?.satuan, "Satuan", { max: 20 }) ?? "pcs";
        const barcode = optionalString(body?.barcode, "Barcode", { max: 50 });
        const kategori = optionalString(body?.kategori, "Kategori", { max: 100 });

        if (hargaJual < hargaBeli) {
          throw new ValidationError("Harga jual tidak boleh lebih kecil dari harga beli");
        }

        const kodeDipakai = await tx.barang.findUnique({ where: { kode } });
        if (kodeDipakai) {
          throw new ValidationError(`Kode barang "${kode}" sudah dipakai`);
        }
        if (barcode) {
          const barcodeDipakai = await tx.barang.findUnique({ where: { barcode } });
          if (barcodeDipakai) {
            throw new ValidationError(`Barcode "${barcode}" sudah dipakai`);
          }
        }

        const barang = await tx.barang.create({
          data: {
            kode,
            barcode,
            nama,
            kategori,
            hargaBeli,
            hargaJual,
            stok,
            stokMinimum,
            satuan,
          },
        });

        const totalPengeluaran = hargaBeli * stok;
        let pengeluaran = null;
        if (totalPengeluaran > 0) {
          pengeluaran = await tx.pengeluaran.create({
            data: {
              tanggal: new Date(),
              kategori: "Pembelian Barang",
              keterangan: `Pembelian barang baru: ${nama} (${stok} ${satuan}) @ ${formatRupiah(hargaBeli)}`,
              jumlah: totalPengeluaran,
            },
          });
        }

        return { barang, pengeluaran, totalPengeluaran };
      }

      const barangId = requireString(body?.barangId, "Barang");
      const qty = requireInt(body?.qty, "Jumlah masuk", { min: 1, max: 1000000 });
      const hargaBeliBaru =
        body?.hargaBeliBaru === undefined || body?.hargaBeliBaru === null || body?.hargaBeliBaru === ""
          ? null
          : requireNumber(body.hargaBeliBaru, "Harga beli baru", { min: 0 });
      const updateHargaBeli = optionalBoolean(body?.updateHargaBeli, false);

      const existing = await tx.barang.findUnique({ where: { id: barangId } });
      if (!existing) {
        throw new ValidationError("Barang tidak ditemukan");
      }

      const hargaBeli =
        updateHargaBeli && hargaBeliBaru !== null ? hargaBeliBaru : existing.hargaBeli;

      if (existing.hargaJual < hargaBeli) {
        throw new ValidationError(
          "Harga beli baru melebihi harga jual. Perbarui harga jual terlebih dahulu."
        );
      }

      // Increment, bukan set absolut — aman terhadap transaksi kasir bersamaan.
      const barang = await tx.barang.update({
        where: { id: barangId },
        data: {
          stok: { increment: qty },
          ...(updateHargaBeli && hargaBeliBaru !== null ? { hargaBeli: hargaBeliBaru } : {}),
        },
      });

      const totalPengeluaran = hargaBeli * qty;
      const pengeluaran = await tx.pengeluaran.create({
        data: {
          tanggal: new Date(),
          kategori: "Pembelian Barang",
          keterangan: `Pembelian ${existing.nama} (${qty} ${existing.satuan}) @ ${formatRupiah(hargaBeli)}`,
          jumlah: totalPengeluaran,
        },
      });

      return { barang, pengeluaran, totalPengeluaran };
    });

    return NextResponse.json(hasil);
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal mencatat barang masuk");
    return NextResponse.json({ error: message }, { status });
  }
}
