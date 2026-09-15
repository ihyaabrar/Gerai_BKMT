import { NextRequest, NextResponse } from "next/server";
import { ambilIdentitas } from "@/lib/identitas";
import { gambarKotak } from "@/lib/gambar";

export const dynamic = "force-dynamic";

/** Lambang bawaan bila logo belum diunggah: lingkaran emas bertuliskan BKMT. */
const IKON_BAWAAN = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<circle cx="32" cy="32" r="32" fill="#e5b73b"/>
<text x="32" y="38" text-anchor="middle" font-family="Arial,sans-serif" font-weight="800" font-size="17" fill="#0e3b26">BKMT</text>
</svg>`;

/**
 * Ikon tab browser dan ikon layar utama HP, diambil dari logo di Kelola Situs
 * Web → Profil Organisasi.
 *
 * Sebagian besar halaman aplikasi dirender statis saat build, jadi alamat
 * logo tidak bisa ditulis langsung di metadata — logo baru tidak akan muncul
 * sampai deploy berikutnya. Metadata cukup menunjuk ke sini, dan rute ini
 * membaca logo terbaru setiap kali diminta.
 */
export async function GET(request: NextRequest) {
  const ukuran = request.nextUrl.searchParams.get("ukuran") === "180" ? 180 : 64;
  const { logoUrl } = await ambilIdentitas();

  if (!logoUrl) {
    return new NextResponse(IKON_BAWAAN, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    });
  }

  // Ikon layar utama iPhone tidak mendukung latar transparan (jadi hitam).
  const tujuan = gambarKotak(logoUrl, ukuran, ukuran === 180 ? "white" : "transparent");
  return NextResponse.redirect(new URL(tujuan, request.url), {
    status: 307,
    headers: { "Cache-Control": "public, max-age=300, s-maxage=300" },
  });
}
