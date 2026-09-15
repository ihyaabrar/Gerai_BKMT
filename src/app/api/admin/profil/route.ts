import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth-middleware";
import { ValidationError, optionalString } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const profil = await prisma.profilOrganisasi.findFirst();
    return NextResponse.json({ data: profil ?? null });
  } catch {
    return NextResponse.json({ error: "Gagal memuat profil" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    if (typeof body?.nama !== "string" || !body.nama.trim()) {
      return NextResponse.json({ error: "Nama organisasi tidak boleh kosong" }, { status: 400 });
    }

    // Hanya kolom yang memang diisi dari halaman profil. Sebelumnya body
    // diteruskan apa adanya ke Prisma: kolom tak dikenal membuat simpan gagal
    // dengan pesan umum, dan id/createdAt bisa ikut ditimpa.
    const data = {
      nama: body.nama.trim().slice(0, 255),
      singkatan: optionalString(body.singkatan, "Singkatan", { max: 50 }),
      slogan: optionalString(body.slogan, "Slogan", { max: 120 }),
      deskripsi: optionalString(body.deskripsi, "Deskripsi", { max: 5000 }),
      visi: optionalString(body.visi, "Visi", { max: 5000 }),
      misi: optionalString(body.misi, "Misi", { max: 5000 }),
      sejarah: optionalString(body.sejarah, "Sejarah", { max: 50000 }),
      logoUrl: optionalString(body.logoUrl, "Logo", { max: 1000 }),
      email: optionalString(body.email, "Email", { max: 255 }),
      telepon: optionalString(body.telepon, "Telepon", { max: 50 }),
      whatsapp: optionalString(body.whatsapp, "WhatsApp", { max: 50 }),
      alamat: optionalString(body.alamat, "Alamat", { max: 1000 }),
      facebook: optionalString(body.facebook, "Facebook", { max: 255 }),
      instagram: optionalString(body.instagram, "Instagram", { max: 255 }),
      tiktok: optionalString(body.tiktok, "TikTok", { max: 255 }),
      youtube: optionalString(body.youtube, "YouTube", { max: 255 }),
      website: optionalString(body.website, "Website", { max: 255 }),
    };

    const existing = await prisma.profilOrganisasi.findFirst();
    const profil = existing
      ? await prisma.profilOrganisasi.update({ where: { id: existing.id }, data })
      : await prisma.profilOrganisasi.create({ data });
    return NextResponse.json({ data: profil });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Gagal menyimpan profil" }, { status: 500 });
  }
}
