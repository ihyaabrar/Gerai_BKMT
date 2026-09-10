import type { Role } from "@/lib/session";

/**
 * Sumber kebenaran tunggal untuk hak akses per role.
 * Dipakai oleh middleware (server), AuthProvider (client) dan Sidebar,
 * supaya UI dan server tidak pernah berbeda pendapat.
 */

/** Halaman yang TIDAK boleh diakses kasir. */
export const KASIR_BLOCKED_PATHS = [
  "/admin",
  "/app/keuangan/laporan",
  "/app/keuangan/distribusi",
  "/app/master/nasabah",
  "/app/sistem/pengaturan",
  "/app/sistem/backup",
] as const;

/**
 * Endpoint API yang TIDAK boleh diakses kasir sama sekali.
 * Endpoint yang hanya sebagian dibatasi (mis. /api/pengaturan boleh dibaca
 * tapi tidak boleh diubah kasir) diatur per-method di route handler-nya.
 */
export const KASIR_BLOCKED_APIS = [
  "/api/admin",
  "/api/backup",
  "/api/laporan",
  "/api/nasabah",
  "/api/upload",
] as const;

export function isAdminRole(role: string | undefined | null): boolean {
  return role === "master" || role === "admin";
}

export function canAccessPath(role: Role | string | undefined, path: string): boolean {
  if (!role) return false;
  if (isAdminRole(role)) return true;
  if (role !== "kasir") return false;
  return !KASIR_BLOCKED_PATHS.some((blocked) => path.startsWith(blocked));
}

export function canAccessApi(role: Role | string | undefined, path: string): boolean {
  if (!role) return false;
  if (isAdminRole(role)) return true;
  if (role !== "kasir") return false;
  return !KASIR_BLOCKED_APIS.some((blocked) => path.startsWith(blocked));
}

/** Route publik yang tidak butuh login sama sekali. */
export function isPublicPath(path: string): boolean {
  if (path === "/" || path === "/login") return true;
  if (path.startsWith("/berita/")) return true;
  if (path.startsWith("/api/public/")) return true;
  if (path.startsWith("/api/auth/")) return true;
  return false;
}
