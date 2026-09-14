import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-middleware";
import { isAdminRole } from "@/lib/permissions";
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
import { hargaBeliRataRata } from "@/lib/keuangan";

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
    const bolehUbahHarga = isAdminRole(auth.user.role);

    // Menerima kiriman barang adalah pekerjaan kasir. Menetapkan harganya
    // bukan — harga menentukan laba, dan laba menentukan bagi hasil nasabah.
    if (mode === "baru" && !bolehUbahHarga) {
      throw new ValidationError(
        "Barang baru hanya bisa ditambahkan oleh pengelola. Hubungi admin untuk mendaftarkan barang ini."
      );
    }

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
        const gambarUrl = optionalString(body?.gambarUrl, "Gambar", { max: 500 });

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
            gambarUrl,
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
              userId: auth.user.id,
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

      if (updateHargaBeli && !bolehUbahHarga) {
        throw new ValidationError(
          "Harga beli hanya bisa diubah oleh pengelola. Stok tetap bisa Anda tambahkan tanpa mengubah harga."
        );
      }

      // Baris barang dikunci sampai transaksi selesai: harga rata-rata dihitung
      // dari stok saat ini, dan penjualan yang masuk bersamaan tidak boleh
      // mengubah stok itu di tengah perhitungan.
      await tx.$queryRaw`SELECT "id" FROM "Barang" WHERE "id" = ${barangId} FOR UPDATE`;

      const existing = await tx.barang.findUnique({ where: { id: barangId } });
      if (!existing) {
        throw new ValidationError("Barang tidak ditemukan");
      }

      // Harga per unit pembelian INI — yang benar-benar dibayar ke supplier.
      const hargaPembelian =
        updateHargaBeli && hargaBeliBaru !== null ? hargaBeliBaru : existing.hargaBeli;

      // Harga beli barang menjadi rata-rata stok lama dan stok yang baru masuk,
      // bukan ditimpa harga terakhir. Lihat hargaBeliRataRata().
      const hargaBeliBaruRata = hargaBeliRataRata(
        existing.stok,
        existing.hargaBeli,
        qty,
        hargaPembelian
      );

      if (existing.hargaJual < hargaBeliBaruRata) {
        throw new ValidationError(
          `Harga beli rata-rata setelah pembelian ini (${formatRupiah(hargaBeliBaruRata)}) ` +
            `melebihi harga jual (${formatRupiah(existing.hargaJual)}). Perbarui harga jual terlebih dahulu.`
        );
      }

      // Increment, bukan set absolut — aman terhadap transaksi kasir bersamaan.
      const barang = await tx.barang.update({
        where: { id: barangId },
        data: {
          stok: { increment: qty },
          ...(hargaBeliBaruRata !== existing.hargaBeli ? { hargaBeli: hargaBeliBaruRata } : {}),
        },
      });

      const totalPengeluaran = hargaPembelian * qty;
      const pengeluaran = await tx.pengeluaran.create({
        data: {
          tanggal: new Date(),
          kategori: "Pembelian Barang",
          keterangan: `Pembelian ${existing.nama} (${qty} ${existing.satuan}) @ ${formatRupiah(hargaPembelian)}`,
          jumlah: totalPengeluaran,
          userId: auth.user.id,
        },
      });

      return {
        barang,
        pengeluaran,
        totalPengeluaran,
        hargaBeliLama: existing.hargaBeli,
        hargaBeliRataRata: hargaBeliBaruRata,
      };
    });

    return NextResponse.json(hasil);
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal mencatat barang masuk", {
      endpoint: "/api/barang-masuk",
      userId: auth.user?.id,
    });
    return NextResponse.json({ error: message }, { status });
  }
}
