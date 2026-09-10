"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { isPublicPath, canAccessPath } from "@/lib/permissions";
import { Loader2 } from "lucide-react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, user, refresh } = useAuthStore();

  // Verifikasi sesi ke server setiap kali route berpindah antar area terproteksi.
  useEffect(() => {
    if (isPublicPath(pathname)) return;
    refresh();
  }, [pathname, refresh]);

  useEffect(() => {
    if (isPublicPath(pathname) || status === "loading") return;

    if (status === "unauthenticated") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!canAccessPath(user?.role, pathname)) {
      router.replace("/app");
    }
  }, [status, user, pathname, router]);

  if (isPublicPath(pathname)) {
    return <>{children}</>;
  }

  if (status !== "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  return <>{children}</>;
}
