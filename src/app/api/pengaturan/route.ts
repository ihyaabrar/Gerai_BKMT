import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let pengaturan = await prisma.pengaturan.findFirst();
    if (!pengaturan) {
      pengaturan = await prisma.pengaturan.create({ data: {} });
    }
    return NextResponse.json(pengaturan);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch pengaturan" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let pengaturan = await prisma.pengaturan.findFirst();

    if (pengaturan) {
      pengaturan = await prisma.pengaturan.update({
        where: { id: pengaturan.id },
        data: body,
      });
    } else {
      pengaturan = await prisma.pengaturan.create({ data: body });
    }

    return NextResponse.json(pengaturan);
  } catch (error) {
    return NextResponse.json({ error: "Failed to save pengaturan" }, { status: 500 });
  }
}
