import { describe, expect, it } from "vitest";
import { cariBarangDariPindai } from "@/lib/barcode";

const daftar = [
  { id: "1", kode: "BRG001", barcode: "8991234567890" },
  { id: "2", kode: "BRG002", barcode: null },
  { id: "3", kode: "8990000000001", barcode: "123" },
];

describe("cariBarangDariPindai", () => {
  it("cocok dengan barcode, mengabaikan spasi dan baris baru dari pemindai", () => {
    expect(cariBarangDariPindai(daftar, " 8991234567890\n")?.id).toBe("1");
  });

  it("cocok dengan kode barang, tanpa beda huruf besar-kecil", () => {
    expect(cariBarangDariPindai(daftar, "brg002")?.id).toBe("2");
  });

  it("barcode didahulukan daripada kode", () => {
    expect(cariBarangDariPindai([...daftar, { id: "4", kode: "123", barcode: null }], "123")?.id).toBe("3");
  });

  it("tidak cocok sebagian dan tidak crash pada barcode kosong", () => {
    expect(cariBarangDariPindai(daftar, "899123")).toBeUndefined();
    expect(cariBarangDariPindai(daftar, "")).toBeUndefined();
  });
});
