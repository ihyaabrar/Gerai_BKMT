import { describe, it, expect } from "vitest";
import { nomorHalaman } from "../../components/ui/pagination";

describe("nomor halaman", () => {
  it("di HP hanya awal, halaman aktif, dan akhir", () => {
    expect(nomorHalaman(1, 28, 0)).toEqual([1, "...", 28]);
    expect(nomorHalaman(14, 28, 0)).toEqual([1, "...", 14, "...", 28]);
    expect(nomorHalaman(28, 28, 0)).toEqual([1, "...", 28]);
  });

  it("di layar lebar dengan tetangga halaman aktif", () => {
    expect(nomorHalaman(1, 28, 1)).toEqual([1, 2, "...", 28]);
    expect(nomorHalaman(14, 28, 1)).toEqual([1, "...", 13, 14, 15, "...", 28]);
  });

  it("tidak ada elipsis bila halamannya sedikit", () => {
    expect(nomorHalaman(2, 3, 1)).toEqual([1, 2, 3]);
    expect(nomorHalaman(1, 2, 0)).toEqual([1, 2]);
  });
});
