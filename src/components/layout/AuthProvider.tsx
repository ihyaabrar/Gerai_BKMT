"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth";

// Route yang bebas diakses tanpa login
const PUBLIC_ROUTES = ["/", "/login"];

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  if (pathname.startsWith("/berita/")) return true;
  if (pathname.startsWith("/api/public/")) return true;
  return false;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, canAccess, user } = useAuthStore();

  useEffect(() => {
    // Public routes — tidak perlu cek auth
    if (isPublicRoute(pathname)) {
      // Kalau sudah login dan buka /login, redirect ke /app
      if (pathname === "/login" && isAuthenticated) {
        router.push("/app");
      }
      return;
    }

    // Belum login → redirect ke /login
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    // Route /admin — hanya master/admin
    if (pathname.startsWith("/admin")) {
      if (user?.role === "kasir") {
        router.push("/app");
      }
      return;
    }

    // Route /app — cek canAccess
    if (!canAccess(pathname)) {
      router.push("/app");
    }
  }, [isAuthenticated, pathname, router, canAccess, user]);

  // Public routes — render langsung
  if (isPublicRoute(pathname)) {
    return <>{children}</>;
  }

  // Belum auth — jangan render apapun (mencegah flash)
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
