import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sortPengurus } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pengurus = await prisma.pengurus.findMany({
      where: { aktif: true },
      select: {
        id: true, nama: true, jabatan: true, tingkatan: true,
        periode: true, fotoUrl: true, urutan: true,
      },
    });
    return NextResponse.json({ data: sortPengurus(pengurus) });
  } catch (error) {
    return NextResponse.json({ error: "Gagal memuat pengurus" }, { status: 500 });
  }
}
