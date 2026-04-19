import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const gerai = await prisma.informasiGerai.findFirst();
    return NextResponse.json({ data: gerai ?? null });
  } catch (error) {
    return NextResponse.json({ error: "Gagal memuat informasi gerai" }, { status: 500 });
  }
}
