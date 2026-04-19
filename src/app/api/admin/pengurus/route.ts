import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth-middleware";
import { sortPengurus } from "@/lib/utils";

export const dynamic = "force-dynamic";

const VALID_TINGKATAN = ["PD", "PC", "Permata"];

export async function GET(request: NextRequest) {
  const auth = requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const pengurus = await prisma.pengurus.findMany({ orderBy: { urutan: "asc" } });
    return NextResponse.json({ data: sortPengurus(pengurus) });
  } catch {
    return NextResponse.json({ error: "Gagal memuat pengurus" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    if (!body.nama?.trim()) return NextResponse.json({ error: "Nama tidak boleh kosong" }, { status: 400 });
    if (!body.jabatan?.trim()) return NextResponse.json({ error: "Jabatan tidak boleh kosong" }, { status: 400 });
    if (!VALID_TINGKATAN.includes(body.tingkatan)) {
      return NextResponse.json({ error: "Tingkatan harus PD, PC, atau Permata" }, { status: 400 });
    }

    const pengurus = await prisma.pengurus.create({ data: body });
    return NextResponse.json({ data: pengurus }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Gagal menambah pengurus" }, { status: 500 });
  }
}
