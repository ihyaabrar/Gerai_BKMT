import { describe, it, expect } from "vitest";
import { canAccessPath } from "../permissions";

describe("hak akses halaman", () => {
  it("halaman Pengguna hanya untuk master", () => {
    expect(canAccessPath("master", "/app/sistem/pengguna")).toBe(true);
    // API-nya master saja; admin dulu melihat menu yang selalu gagal dimuat.
    expect(canAccessPath("admin", "/app/sistem/pengguna")).toBe(false);
    expect(canAccessPath("kasir", "/app/sistem/pengguna")).toBe(false);
  });

  it("semua role bisa membuka Akun Saya untuk ganti password", () => {
    for (const role of ["master", "admin", "kasir"]) {
      expect(canAccessPath(role, "/app/akun")).toBe(true);
    }
  });

  it("admin tetap bisa membuka halaman admin lainnya", () => {
    expect(canAccessPath("admin", "/app/sistem/pengaturan")).toBe(true);
    expect(canAccessPath("admin", "/app/keuangan/distribusi")).toBe(true);
  });
});
