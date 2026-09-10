import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth, requireAuth } from "@/lib/auth-middleware";
import {
  optionalString,
  requireString,
  toErrorResponse,
} from "@/lib/validate";

export const dynamic = "force-dynamic";

function parseSupplier(body: any, { partial = false } = {}) {
  const data: Record<string, unknown> = {};
  const has = (key: string) => body?.[key] !== undefined;

  if (!partial || has("nama")) data.nama = requireString(body.nama, "Nama supplier", { max: 150 });
  if (has("telepon")) data.telepon = optionalString(body.telepon, "Telepon", { max: 30 });
  if (has("alamat")) data.alamat = optionalString(body.alamat, "Alamat", { max: 500 });

  return data;
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const supplier = await prisma.supplier.findMany({
      where: { aktif: true },
      orderBy: { nama: "asc" },
    });
    return NextResponse.json(supplier);
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal memuat supplier");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const data = parseSupplier(await request.json());
    const supplier = await prisma.supplier.create({ data: { ...data, aktif: true } as any });
    return NextResponse.json(supplier);
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal menyimpan supplier");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const id = requireString(body?.id, "ID supplier");
    const data = parseSupplier(body, { partial: true });

    const existing = await prisma.supplier.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Supplier tidak ditemukan" }, { status: 404 });
    }

    const supplier = await prisma.supplier.update({ where: { id }, data: data as any });
    return NextResponse.json(supplier);
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal memperbarui supplier");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const existing = await prisma.supplier.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Supplier tidak ditemukan" }, { status: 404 });
    }

    await prisma.supplier.update({ where: { id }, data: { aktif: false } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal menghapus supplier");
    return NextResponse.json({ error: message }, { status });
  }
}
