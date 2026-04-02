import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const barang = await prisma.barang.findMany({
    where: { aktif: true },
    orderBy: { nama: "asc" },
  });
  return NextResponse.json(barang);
}

export async function POST(request: Request) {
  const body = await request.json();
  const barang = await prisma.barang.create({
    data: body,
  });
  return NextResponse.json(barang);
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const { id, ...data } = body;
  
  const barang = await prisma.barang.update({
    where: { id },
    data,
  });
  
  return NextResponse.json(barang);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  
  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }
  
  // Soft delete
  const barang = await prisma.barang.update({
    where: { id },
    data: { aktif: false },
  });
  
  return NextResponse.json(barang);
}
