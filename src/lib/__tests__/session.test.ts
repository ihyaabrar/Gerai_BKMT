import { describe, it, expect, afterEach, vi } from "vitest";
import { MissingAuthSecretError } from "../session";

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
