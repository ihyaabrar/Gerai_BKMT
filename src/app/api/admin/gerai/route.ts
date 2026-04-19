import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth-middleware";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const gerai = await prisma.informasiGerai.findFirst();
    return NextResponse.json({ data: gerai ?? null });
  } catch {
    return NextResponse.json({ error: "Gagal memuat informasi gerai" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    if (!body.nama?.trim()) return NextResponse.json({ error: "Nama gerai tidak boleh kosong" }, { status: 400 });
    if (!body.alamat?.trim()) return NextResponse.json({ error: "Alamat tidak boleh kosong" }, { status: 400 });

    const existing = await prisma.informasiGerai.findFirst();
    let gerai;
    if (existing) {
      const { id: _id, createdAt: _c, updatedAt: _u, ...data } = body;
      gerai = await prisma.informasiGerai.update({ where: { id: existing.id }, data });
    } else {
      gerai = await prisma.informasiGerai.create({ data: body });
    }
    return NextResponse.json({ data: gerai });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan informasi gerai" }, { status: 500 });
  }
}
