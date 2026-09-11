import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { uploadImage } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

// Folder dibatasi daftar putih supaya nilai dari form tidak bisa dipakai
// menulis ke lokasi sembarang di akun Cloudinary.
const ALLOWED_FOLDERS = ["barang", "berita", "pengurus", "logo", "gerai", "general"];

export async function POST(request: NextRequest) {
  // Dibuka untuk semua pengguna yang login karena kasir juga perlu
  // mengunggah foto produk saat mencatat barang masuk.
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  // Body yang bukan multipart valid adalah kesalahan pengirim (400),
  // bukan kegagalan server (500).
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Permintaan tidak valid: gunakan form-data berisi file" },
      { status: 400 }
    );
  }

  try {
    const file = formData.get("file") as File | null;
    const folderDiminta = (formData.get("folder") as string) || "general";
    const folder = ALLOWED_FOLDERS.includes(folderDiminta) ? folderDiminta : "general";

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    }

    const fileType = file.type.toLowerCase();
    if (!ALLOWED_TYPES.includes(fileType)) {
      return NextResponse.json(
        { error: "Format tidak didukung. Gunakan JPG, PNG, WebP, atau GIF." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `Ukuran file terlalu besar (${(file.size / 1024 / 1024).toFixed(1)}MB). Maksimal 5MB.` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const url = await uploadImage(buffer, folder);

    return NextResponse.json({ url, success: true });
  } catch (error: any) {
    console.error("Upload error:", error?.message || error);
    return NextResponse.json(
      { error: `Gagal upload: ${error?.message || "Unknown error"}` },
      { status: 500 }
    );
  }
}
