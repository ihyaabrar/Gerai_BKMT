import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const members = await prisma.member.findMany({
    where: { aktif: true },
    orderBy: { nama: "asc" },
  });
  return NextResponse.json(members);
}

export async function POST(request: Request) {
  const body = await request.json();
  const member = await prisma.member.create({
    data: body,
  });
  return NextResponse.json(member);
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const { id, ...data } = body;
  const member = await prisma.member.update({ where: { id }, data });
  return NextResponse.json(member);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  await prisma.member.update({ where: { id }, data: { aktif: false } });
  return NextResponse.json({ success: true });
}
