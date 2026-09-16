import { describe, expect, it } from "vitest";
import { jenisGambarDariByte } from "@/lib/berkas-gambar";

const b = (...angka: number[]) => Uint8Array.from(angka);

describe("jenisGambarDariByte", () => {
  it("mengenali JPEG, PNG, GIF, dan WebP dari angka ajaib", () => {
    expect(jenisGambarDariByte(b(0xff, 0xd8, 0xff, 0xe0, 0x00))).toBe("image/jpeg");
    expect(jenisGambarDariByte(b(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe("image/png");
    expect(jenisGambarDariByte(b(0x47, 0x49, 0x46, 0x38, 0x39, 0x61))).toBe("image/gif");
    expect(
      jenisGambarDariByte(b(0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50))
    ).toBe("image/webp");
  });

  it("menolak berkas yang bukan gambar walau labelnya gambar", () => {
    // "MZ" (exe), "%PDF", teks biasa, dan berkas terlalu pendek.
    expect(jenisGambarDariByte(b(0x4d, 0x5a, 0x90, 0x00))).toBeNull();
    expect(jenisGambarDariByte(b(0x25, 0x50, 0x44, 0x46))).toBeNull();
    expect(jenisGambarDariByte(b(0x3c, 0x73, 0x63, 0x72, 0x69, 0x70, 0x74))).toBeNull();
    expect(jenisGambarDariByte(b(0xff, 0xd8))).toBeNull();
    expect(jenisGambarDariByte(b())).toBeNull();
  });
});
