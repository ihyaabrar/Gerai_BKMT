import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth-middleware";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const profil = await prisma.profilOrganisasi.findFirst();
    return NextResponse.json({ data: profil ?? null });
  } catch {
    return NextResponse.json({ error: "Gagal memuat profil" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    if (!body.nama?.trim()) {
      return NextResponse.json({ error: "Nama organisasi tidak boleh kosong" }, { status: 400 });
    }

    const existing = await prisma.profilOrganisasi.findFirst();
    let profil;
    if (existing) {
      profil = await prisma.profilOrganisasi.update({ where: { id: existing.id }, data: body });
    } else {
      profil = await prisma.profilOrganisasi.create({ data: body });
    }
    return NextResponse.json({ data: profil });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan profil" }, { status: 500 });
  }
}
