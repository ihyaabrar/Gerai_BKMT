import { describe, expect, it } from "vitest";
import { PANDUAN } from "@/lib/panduan";
import { canAccessPath } from "@/lib/permissions";

describe("panduan", () => {
  it("id unik", () => {
    const id = PANDUAN.map((p) => p.id);
    expect(new Set(id).size).toBe(id.length);
  });

  it("panduan untuk semua tidak menautkan halaman yang tertutup bagi kasir", () => {
    for (const p of PANDUAN.filter((p) => p.pembaca === "semua")) {
      if (p.tautan) expect(canAccessPath("kasir", p.tautan.href), p.id).toBe(true);
    }
  });

  it("tautan pengurus bisa dibuka master", () => {
    for (const p of PANDUAN) {
      if (p.tautan) expect(canAccessPath("master", p.tautan.href), p.id).toBe(true);
    }
  });

  it("setiap panduan punya langkah", () => {
    for (const p of PANDUAN) expect(p.langkah.length, p.id).toBeGreaterThan(0);
  });
});
