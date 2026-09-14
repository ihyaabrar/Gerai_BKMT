import { describe, it, expect, afterEach, vi } from "vitest";
import {
  MissingAuthSecretError,
  SESSION_MAX_AGE,
  batasSesiBaru,
  waktuTerbit,
} from "../session";

afterEach(() => vi.unstubAllEnvs());

describe("MissingAuthSecretError", () => {
  it("membedakan variabel yang belum ada", () => {
    const e = new MissingAuthSecretError("kosong");
    expect(e.sebab).toBe("kosong");
    expect(e.message).toContain("belum diatur");
    expect(e.message).not.toContain("karakter;");
  });

  it("membedakan variabel yang terlalu pendek, dan menyebut panjangnya", () => {
    const e = new MissingAuthSecretError("pendek", 12);
    expect(e.sebab).toBe("pendek");
    expect(e.message).toContain("hanya 12 karakter");
    expect(e.message).toContain("minimal 32");
  });

  it("tidak pernah memuat nilai rahasianya, hanya panjangnya", () => {
    const e = new MissingAuthSecretError("pendek", 31);
    expect(e.message).toMatch(/31 karakter/);
    expect(e.message.length).toBeLessThan(250);
  });
});

describe("waktu terbit sesi", () => {
  it("memakai iat bila ada", () => {
    expect(
      waktuTerbit({ id: "u", nama: "A", username: "a", role: "kasir", iat: 1_000, exp: 50_000 })
    ).toBe(1_000);
  });

  it("cookie lama tanpa iat dihitung dari exp dikurangi umur sesi", () => {
    expect(
      waktuTerbit({ id: "u", nama: "A", username: "a", role: "kasir", exp: 50_000 })
    ).toBe(50_000 - SESSION_MAX_AGE);
  });

  it("batas pencabutan dibulatkan ke detik penuh", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-15T10:00:00.750Z"));
    expect(batasSesiBaru().toISOString()).toBe("2026-09-15T10:00:00.000Z");
    vi.useRealTimers();
  });
});
