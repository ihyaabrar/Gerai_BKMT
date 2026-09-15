import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth-middleware";
import { sortPengurus } from "@/lib/utils";
import { parsePengurus } from "@/lib/validasi-pengurus";
import { toErrorResponse } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const pengurus = await prisma.pengurus.findMany({ orderBy: { urutan: "asc" } });
    return NextResponse.json({ data: sortPengurus(pengurus) });
  } catch {
    return NextResponse.json({ error: "Gagal memuat pengurus" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const data = parsePengurus(await request.json().catch(() => null));
    const pengurus = await prisma.pengurus.create({ data: data as any });
    return NextResponse.json({ data: pengurus }, { status: 201 });
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal menambah pengurus");
    return NextResponse.json({ error: message }, { status });
  }
}
