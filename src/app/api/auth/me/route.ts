import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-middleware";

export const dynamic = "force-dynamic";

/**
 * Dipakai client untuk memverifikasi sesi ke server saat aplikasi dimuat,
 * supaya state di localStorage tidak bisa dipakai memalsukan login.
 */
export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user });
}
