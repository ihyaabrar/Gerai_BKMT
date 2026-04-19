import { NextRequest, NextResponse } from "next/server";

export interface SessionUser {
  id: string;
  role: string;
  nama: string;
}

export type AuthResult =
  | { user: SessionUser; error?: never }
  | { user?: never; error: NextResponse };

export function requireAdminAuth(request: NextRequest): AuthResult {
  const sessionCookie = request.cookies.get("session");

  if (!sessionCookie?.value) {
    return {
      error: NextResponse.json(
        { error: "Autentikasi diperlukan" },
        { status: 401 }
      ),
    };
  }

  let user: SessionUser;
  try {
    user = JSON.parse(sessionCookie.value) as SessionUser;
  } catch {
    return {
      error: NextResponse.json(
        { error: "Sesi tidak valid" },
        { status: 401 }
      ),
    };
  }

  if (!user?.id || !user?.role) {
    return {
      error: NextResponse.json(
        { error: "Sesi tidak valid" },
        { status: 401 }
      ),
    };
  }

  if (user.role === "kasir") {
    return {
      error: NextResponse.json(
        { error: "Akses ditolak" },
        { status: 403 }
      ),
    };
  }

  if (user.role !== "master" && user.role !== "admin") {
    return {
      error: NextResponse.json(
        { error: "Akses ditolak" },
        { status: 403 }
      ),
    };
  }

  return { user };
}
