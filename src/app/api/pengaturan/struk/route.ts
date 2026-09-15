import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth-middleware";
import { ValidationError, optionalString, toErrorResponse } from "@/lib/validate";

export const dynamic = "force-dynamic";

/**
 * Tampilan struk (logo, teks atas, teks bawah). Dipisah dari POST
 * /api/pengaturan supaya mengubah struk tidak ikut tertahan kunci persentase
 * bagi hasil dan tidak perlu mengirim ulang seluruh pengaturan toko.
 */
export async function PUT(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    if (typeof body?.strukLogo !== "boolean") {
      throw new ValidationError("Pilihan logo struk tidak valid");
    }
    const logoUrl = optionalString(body?.strukLogoUrl, "Logo struk", { max: 1000 });
    if (logoUrl && !/^https:\/\//i.test(logoUrl)) {
      throw new ValidationError("Logo struk harus berupa gambar yang diunggah");
    }
    const data = {
      strukLogo: body.strukLogo,
      strukLogoUrl: logoUrl,
      strukHeader: optionalString(body?.strukHeader, "Teks atas struk", { max: 300 }),
      strukFooter: optionalString(body?.strukFooter, "Teks bawah struk", { max: 300 }),
    };

    const existing = await prisma.pengaturan.findFirst();
    const pengaturan = existing
      ? await prisma.pengaturan.update({ where: { id: existing.id }, data })
      : await prisma.pengaturan.create({ data });
    return NextResponse.json(pengaturan);
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal menyimpan tampilan struk");
    return NextResponse.json({ error: message }, { status });
  }
}
