import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth, requireAuth } from "@/lib/auth-middleware";
import {
  ValidationError,
  optionalBoolean,
  optionalString,
  parsePagination,
  requireInt,
  requireNumber,
  requireString,
  toErrorResponse,
} from "@/lib/validate";

export const dynamic = "force-dynamic";

/** Hanya kolom ini yang boleh diisi client — mencegah mass assignment. */
function parseBarang(body: any, { partial = false } = {}) {
  const data: Record<string, unknown> = {};

  const has = (key: string) => body?.[key] !== undefined;

  if (!partial || has("kode")) data.kode = requireString(body.kode, "Kode barang", { max: 50 });
  if (!partial || has("nama")) data.nama = requireString(body.nama, "Nama barang", { max: 150 });
  if (!partial || has("hargaBeli"))
    data.hargaBeli = requireNumber(body.hargaBeli, "Harga beli", { min: 0 });
  if (!partial || has("hargaJual"))
    data.hargaJual = requireNumber(body.hargaJual, "Harga jual", { min: 0 });

  if (has("barcode")) data.barcode = optionalString(body.barcode, "Barcode", { max: 50 });
  if (has("kategori")) data.kategori = optionalString(body.kategori, "Kategori", { max: 100 });
  if (has("gambarUrl")) data.gambarUrl = optionalString(body.gambarUrl, "Gambar", { max: 500 });
  if (has("satuan")) data.satuan = optionalString(body.satuan, "Satuan", { max: 20 }) ?? "pcs";
  if (has("stok")) data.stok = requireInt(body.stok, "Stok", { min: 0 });
  if (has("stokMinimum")) data.stokMinimum = requireInt(body.stokMinimum, "Stok minimum", { min: 0 });
  if (has("aktif")) data.aktif = optionalBoolean(body.aktif, true);

  if (
    typeof data.hargaJual === "number" &&
    typeof data.hargaBeli === "number" &&
    data.hargaJual < data.hargaBeli
  ) {
    throw new ValidationError("Harga jual tidak boleh lebih kecil dari harga beli");
  }

  return data;
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    const kategori = searchParams.get("kategori")?.trim();
    const stokMenipis = searchParams.get("stokMenipis") === "true";
    const paginated = searchParams.has("page") || searchParams.has("limit");

    const where: any = { aktif: true };
    if (search) {
      where.OR = [
        { nama: { contains: search, mode: "insensitive" } },
        { kode: { contains: search, mode: "insensitive" } },
        { barcode: { contains: search, mode: "insensitive" } },
      ];
    }
    if (kategori) where.kategori = kategori;

    // Tanpa parameter paginasi tetap kembalikan array polos supaya
    // halaman kasir & inventori yang ada tidak perlu diubah.
    if (!paginated) {
      const barang = await prisma.barang.findMany({ where, orderBy: { nama: "asc" } });
      return NextResponse.json(
        stokMenipis ? barang.filter((b) => b.stok <= b.stokMinimum) : barang
      );
    }

    const { page, limit, skip } = parsePagination(searchParams);
    const [data, total] = await Promise.all([
      prisma.barang.findMany({ where, orderBy: { nama: "asc" }, skip, take: limit }),
      prisma.barang.count({ where }),
    ]);

    return NextResponse.json({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal memuat barang");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  // Membuat barang berarti menetapkan harga beli dan harga jual — keduanya
  // langsung menentukan laba, dan laba menentukan bagi hasil nasabah.
  // Kasir mencatat barang masuk lewat /api/barang-masuk, bukan di sini.
  const auth = await requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const data = parseBarang(body);

    const duplikat = await prisma.barang.findUnique({ where: { kode: data.kode as string } });
    if (duplikat) {
      throw new ValidationError(`Kode barang "${data.kode}" sudah dipakai`);
    }
    if (data.barcode) {
      const barcodeDipakai = await prisma.barang.findUnique({
        where: { barcode: data.barcode as string },
      });
      if (barcodeDipakai) {
        throw new ValidationError(`Barcode "${data.barcode}" sudah dipakai`);
      }
    }

    const barang = await prisma.barang.create({ data: data as any });
    return NextResponse.json(barang);
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal menyimpan barang");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: NextRequest) {
  // Sebelumnya cukup login apa pun: kasir bisa mengubah hargaBeli, hargaJual,
  // dan stok siapa pun tanpa jejak. Penyesuaian stok oleh kasir tetap bisa
  // lewat /api/penyesuaian, yang mencatat alasan dan pelakunya.
  const auth = await requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const id = requireString(body?.id, "ID barang");

    // Stok tidak diubah lewat sini: setiap perubahan stok harus meninggalkan
    // jejak (Barang Masuk atau Penyesuaian, dengan alasan dan pelakunya).
    // Mengetik angka stok baru di form edit menghapus jejak itu — dan barang
    // yang "hilang" tidak pernah tercatat sebagai kerugian.
    if (body?.stok !== undefined) {
      throw new ValidationError(
        "Stok tidak bisa diubah dari sini. Gunakan Barang Masuk untuk menambah, atau Penyesuaian untuk mengurangi."
      );
    }

    const data = parseBarang(body, { partial: true });

    const existing = await prisma.barang.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Barang tidak ditemukan" }, { status: 404 });
    }

    // Tanpa pemeriksaan ini, kode atau barcode kembar jatuh sebagai galat
    // database dan pengguna hanya melihat "Gagal memperbarui barang".
    if (typeof data.kode === "string" && data.kode !== existing.kode) {
      const kodeDipakai = await prisma.barang.findUnique({ where: { kode: data.kode } });
      if (kodeDipakai) {
        throw new ValidationError(`Kode barang "${data.kode}" sudah dipakai ${kodeDipakai.nama}`);
      }
    }
    if (typeof data.barcode === "string" && data.barcode !== existing.barcode) {
      const barcodeDipakai = await prisma.barang.findUnique({ where: { barcode: data.barcode } });
      if (barcodeDipakai) {
        throw new ValidationError(
          `Barcode "${data.barcode}" sudah dipakai ${barcodeDipakai.nama}`
        );
      }
    }

    // Validasi silang harga saat hanya satu sisi yang dikirim.
    const hargaBeli = (data.hargaBeli as number) ?? existing.hargaBeli;
    const hargaJual = (data.hargaJual as number) ?? existing.hargaJual;
    if (hargaJual < hargaBeli) {
      throw new ValidationError("Harga jual tidak boleh lebih kecil dari harga beli");
    }

    const barang = await prisma.barang.update({ where: { id }, data: data as any });
    return NextResponse.json(barang);
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal memperbarui barang");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  // Menonaktifkan barang hanya boleh oleh master/admin.
  const auth = await requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const existing = await prisma.barang.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Barang tidak ditemukan" }, { status: 404 });
    }

    const barang = await prisma.barang.update({ where: { id }, data: { aktif: false } });
    return NextResponse.json(barang);
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal menghapus barang");
    return NextResponse.json({ error: message }, { status });
  }
}
