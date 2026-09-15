import { describe, expect, it } from "vitest";
import { angkaDariTeks, saranUangBayar, teksRibuan } from "@/lib/uang";

describe("isian uang", () => {
  it("membaca angka dengan titik ribuan, Rp, atau spasi", () => {
    expect(angkaDariTeks("150.000")).toBe(150000);
    expect(angkaDariTeks("Rp 25.500")).toBe(25500);
    expect(angkaDariTeks("7000")).toBe(7000);
    expect(angkaDariTeks("")).toBeNull();
    expect(angkaDariTeks("abc")).toBeNull();
  });

  it("menampilkan titik ribuan", () => {
    expect(teksRibuan(150000)).toBe("150.000");
    expect(teksRibuan(0)).toBe("0");
    expect(teksRibuan(null)).toBe("");
  });
});

describe("saranUangBayar", () => {
  it("memberi pecahan terdekat di atas total", () => {
    expect(saranUangBayar(23500)).toEqual([25000, 30000, 40000, 50000]);
    expect(saranUangBayar(87000)).toEqual([90000, 100000]);
  });

  it("tidak menyarankan uang pas (sudah ada tombol sendiri)", () => {
    expect(saranUangBayar(50000)).toEqual([60000, 100000]);
  });

  it("kosong bila total nol", () => {
    expect(saranUangBayar(0)).toEqual([]);
  });
});
