import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth, requireAuth } from "@/lib/auth-middleware";
import {
  ValidationError,
  optionalString,
  requireInt,
  requireString,
  toErrorResponse,
} from "@/lib/validate";

export const dynamic = "force-dynamic";

/**
 * Nomor member berikutnya dihitung dari kode tertinggi yang ada.
 * Sebelumnya kode dibuat di browser dari elemen terakhir daftar yang
 * diurutkan berdasarkan NAMA, sehingga sering menghasilkan kode duplikat.
 */
async function generateKodeMember(): Promise<string> {
  const terakhir = await prisma.member.findFirst({
    where: { kode: { startsWith: "MBR" } },
    orderBy: { kode: "desc" },
    select: { kode: true },
  });

  const nomor = terakhir ? parseInt(terakhir.kode.replace(/\D/g, ""), 10) || 0 : 0;
  // 5 digit, sama dengan format data seed (MBR00001).
  return `MBR${String(nomor + 1).padStart(5, "0")}`;
}

function parseMember(body: any, { partial = false } = {}) {
  const data: Record<string, unknown> = {};
  const has = (key: string) => body?.[key] !== undefined;

  if (has("kode")) data.kode = requireString(body.kode, "Kode member", { max: 50 });
  if (!partial || has("nama")) data.nama = requireString(body.nama, "Nama member", { max: 150 });
  if (has("telepon")) data.telepon = optionalString(body.telepon, "Telepon", { max: 30 });
  if (has("alamat")) data.alamat = optionalString(body.alamat, "Alamat", { max: 500 });
  if (has("poin")) data.poin = requireInt(body.poin, "Poin", { min: 0 });

  return data;
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const search = new URL(request.url).searchParams.get("search")?.trim();
    const where: any = { aktif: true };
    if (search) {
      where.OR = [
        { nama: { contains: search, mode: "insensitive" } },
        { kode: { contains: search, mode: "insensitive" } },
      ];
    }

    const members = await prisma.member.findMany({ where, orderBy: { nama: "asc" } });
    return NextResponse.json(members);
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal memuat member");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const data = parseMember(await request.json());

    if (data.kode) {
      const duplikat = await prisma.member.findUnique({
        where: { kode: data.kode as string },
      });
      if (duplikat) {
        throw new ValidationError(`Kode member "${data.kode}" sudah dipakai`);
      }
    } else {
      data.kode = await generateKodeMember();
    }

    const member = await prisma.member.create({ data: data as any });
    return NextResponse.json(member);
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal menyimpan member");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const id = requireString(body?.id, "ID member");
    const data = parseMember(body, { partial: true });

    const existing = await prisma.member.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Member tidak ditemukan" }, { status: 404 });
    }

    const member = await prisma.member.update({ where: { id }, data: data as any });
    return NextResponse.json(member);
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal memperbarui member");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const existing = await prisma.member.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Member tidak ditemukan" }, { status: 404 });
    }

    await prisma.member.update({ where: { id }, data: { aktif: false } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal menghapus member");
    return NextResponse.json({ error: message }, { status });
  }
}
