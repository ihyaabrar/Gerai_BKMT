import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { canAccessApi, canAccessPath, isPublicPath } from "@/lib/permissions";

/**
 * Penjaga di sisi server untuk semua halaman & API non-publik.
 * Ini yang menutup celah lama: dulu proteksi hanya di client (localStorage),
 * jadi API bisa dipanggil langsung tanpa login sama sekali.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) return NextResponse.next();

  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  const isApi = pathname.startsWith("/api/");

  if (!session) {
    if (isApi) {
      return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    const response = NextResponse.redirect(loginUrl);
    // Bersihkan cookie kedaluwarsa / rusak supaya tidak loop.
    response.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
    return response;
  }

  const allowed = isApi
    ? canAccessApi(session.role, pathname)
    : canAccessPath(session.role, pathname);

  if (!allowed) {
    if (isApi) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/app", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Semua route kecuali aset statis Next.js dan file publik.
     * Route publik tetap disaring lagi lewat isPublicPath() di atas.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\.(?:png|jpg|jpeg|gif|svg|webp|ico|txt|xml)$).*)",
  ],
};
