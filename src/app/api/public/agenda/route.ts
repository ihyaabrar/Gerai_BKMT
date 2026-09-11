import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Agenda untuk halaman publik: kegiatan yang belum lewat dan belum dibatalkan,
 * diurutkan dari yang paling dekat.
 */
export async function GET() {
  try {
    const awalHariIni = new Date();
    awalHariIni.setHours(0, 0, 0, 0);

    const agenda = await prisma.agendaKegiatan.findMany({
      where: {
        tanggal: { gte: awalHariIni },
        status: { notIn: ["batal", "selesai"] },
      },
      orderBy: { tanggal: "asc" },
      take: 8,
      select: {
        id: true,
        judul: true,
        deskripsi: true,
        tanggal: true,
        waktuMulai: true,
        waktuSelesai: true,
        lokasi: true,
        kategori: true,
      },
    });
    return NextResponse.json({ data: agenda });
  } catch {
    return NextResponse.json({ error: "Gagal memuat agenda" }, { status: 500 });
  }
}
