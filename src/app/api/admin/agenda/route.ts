import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth-middleware";
import {
  ValidationError,
  optionalString,
  requireOneOf,
  requireString,
  toErrorResponse,
} from "@/lib/validate";

export const dynamic = "force-dynamic";

const STATUS = ["terjadwal", "berlangsung", "selesai", "batal"] as const;

/** Jam ditulis "HH:MM"; formatnya divalidasi agar tampilannya konsisten. */
function jamOpsional(nilai: unknown, field: string): string | null {
  const teks = optionalString(nilai, field, { max: 5 });
  if (!teks) return null;
  if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(teks)) {
    throw new ValidationError(`${field} harus berformat HH:MM, misalnya 08:30`);
  }
  return teks;
}

function tanggalWajib(nilai: unknown): Date {
  const teks = requireString(nilai, "Tanggal", { max: 40 });
  const tanggal = new Date(teks);
  if (Number.isNaN(tanggal.getTime())) {
    throw new ValidationError("Tanggal tidak valid");
  }
  return tanggal;
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const agenda = await prisma.agendaKegiatan.findMany({
      orderBy: { tanggal: "desc" },
    });
    return NextResponse.json({ data: agenda });
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal memuat agenda");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const waktuMulai = jamOpsional(body?.waktuMulai, "Waktu mulai");
    const waktuSelesai = jamOpsional(body?.waktuSelesai, "Waktu selesai");

    if (waktuMulai && waktuSelesai && waktuSelesai <= waktuMulai) {
      throw new ValidationError("Waktu selesai harus setelah waktu mulai");
    }

    const agenda = await prisma.agendaKegiatan.create({
      data: {
        judul: requireString(body?.judul, "Judul", { max: 150 }),
        tanggal: tanggalWajib(body?.tanggal),
        deskripsi: optionalString(body?.deskripsi, "Deskripsi", { max: 1000 }),
        lokasi: optionalString(body?.lokasi, "Lokasi", { max: 200 }),
        kategori: optionalString(body?.kategori, "Kategori", { max: 60 }),
        waktuMulai,
        waktuSelesai,
        status: body?.status
          ? requireOneOf(body.status, "Status", STATUS)
          : "terjadwal",
      },
    });
    return NextResponse.json({ data: agenda });
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal menyimpan agenda");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const id = requireString(body?.id, "ID agenda");

    const existing = await prisma.agendaKegiatan.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Agenda tidak ditemukan" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (body?.judul !== undefined)
      data.judul = requireString(body.judul, "Judul", { max: 150 });
    if (body?.tanggal !== undefined) data.tanggal = tanggalWajib(body.tanggal);
    if (body?.deskripsi !== undefined)
      data.deskripsi = optionalString(body.deskripsi, "Deskripsi", { max: 1000 });
    if (body?.lokasi !== undefined)
      data.lokasi = optionalString(body.lokasi, "Lokasi", { max: 200 });
    if (body?.kategori !== undefined)
      data.kategori = optionalString(body.kategori, "Kategori", { max: 60 });
    if (body?.waktuMulai !== undefined)
      data.waktuMulai = jamOpsional(body.waktuMulai, "Waktu mulai");
    if (body?.waktuSelesai !== undefined)
      data.waktuSelesai = jamOpsional(body.waktuSelesai, "Waktu selesai");
    if (body?.status !== undefined)
      data.status = requireOneOf(body.status, "Status", STATUS);

    const mulai = (data.waktuMulai as string) ?? existing.waktuMulai;
    const selesai = (data.waktuSelesai as string) ?? existing.waktuSelesai;
    if (mulai && selesai && selesai <= mulai) {
      throw new ValidationError("Waktu selesai harus setelah waktu mulai");
    }

    const agenda = await prisma.agendaKegiatan.update({
      where: { id },
      data: data as any,
    });
    return NextResponse.json({ data: agenda });
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal memperbarui agenda");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const existing = await prisma.agendaKegiatan.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Agenda tidak ditemukan" }, { status: 404 });
    }

    await prisma.agendaKegiatan.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal menghapus agenda");
    return NextResponse.json({ error: message }, { status });
  }
}
