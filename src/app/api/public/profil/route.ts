import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const profil = await prisma.profilOrganisasi.findFirst();
    return NextResponse.json({ data: profil ?? null });
  } catch (error) {
    return NextResponse.json({ error: "Gagal memuat profil" }, { status: 500 });
  }
}
