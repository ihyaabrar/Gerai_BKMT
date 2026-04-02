"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, canAccess } = useAuthStore();

  useEffect(() => {
    // Skip auth check for login page
    if (pathname === "/login") return;

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    // Check if user can access current path
    if (!canAccess(pathname)) {
      router.push("/");
    }
  }, [isAuthenticated, pathname, router, canAccess]);

  // Show login page without sidebar
  if (pathname === "/login") {
    return <>{children}</>;
  }

  // Show loading or redirect
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
