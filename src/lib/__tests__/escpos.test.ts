import { describe, it, expect } from "vitest";
import {
  KOLOM,
  bungkus,
  duaKolom,
  rupiahPolos,
  strukKeEscPos,
  susunStruk,
  teksPolos,
} from "../escpos";
import type { DataStruk } from "../struk";

const data: DataStruk = {
  nomorTransaksi: "TRX20260915101500AB12",
  tanggal: new Date(2026, 8, 15, 10, 15),
  items: [
    { nama: "Gula Pasir Kemasan Premium Satu Kilogram", qty: 2, harga: 16_500, subtotal: 33_000 },
    { nama: "Teh", qty: 1, harga: 5_000, subtotal: 5_000 },
  ],
  subtotal: 38_000,
  diskon: 1_900,
  total: 36_100,
  bayar: 50_000,
  kembalian: 13_900,
  member: "Siti Aminah",
  kasir: "Kasir 1",
};
const toko = { nama: "Gerai BKMT Kubu Raya", alamat: "Jl. Arteri Supadio", telepon: "0812" };

describe("struk printer thermal", () => {
  it("rupiah tanpa spasi tak-terputus", () => {
    expect(rupiahPolos(1_234_567)).toBe("Rp1.234.567");
    expect(rupiahPolos(-1_900)).toBe("-Rp1.900");
    expect(rupiahPolos(0)).toBe("Rp0");
  });

  it("hanya karakter ASCII yang dikirim ke printer", () => {
    expect(teksPolos("Café — “Kopi”")).toBe('Cafe - "Kopi"');
    expect(teksPolos("Rp 10.000")).toBe("Rp 10.000");
  });

  it("nama panjang dibungkus di spasi", () => {
    const baris = bungkus("Gula Pasir Kemasan Premium Satu Kilogram", 16);
    expect(baris.every((b) => b.length <= 16)).toBe(true);
    expect(baris.join(" ")).toBe("Gula Pasir Kemasan Premium Satu Kilogram");
  });

  it("dua kolom rata kiri-kanan tepat selebar kertas", () => {
    const [baris] = duaKolom("Subtotal", "Rp38.000", 32);
    expect(baris.length).toBe(32);
    expect(baris.startsWith("Subtotal")).toBe(true);
    expect(baris.endsWith("Rp38.000")).toBe(true);
  });

  it("tidak ada baris melebihi lebar kertas 58 mm maupun 80 mm", () => {
    for (const lebar of [58, 80] as const) {
      for (const b of susunStruk(data, toko, lebar)) {
        const batas = b.besar ? Math.floor(KOLOM[lebar] / 2) : KOLOM[lebar];
        expect(b.teks.length, `"${b.teks}"`).toBeLessThanOrEqual(batas);
      }
    }
  });

  it("memuat angka dari transaksi dan tanda salinan bila dicetak ulang", () => {
    const teks = susunStruk({ ...data, salinan: true }, toko, 58).map((b) => b.teks).join("\n");
    expect(teks).toContain("*** SALINAN ***");
    expect(teks).toContain("Rp36.100");
    expect(teks).toContain("-Rp1.900");
    expect(teks).toContain("Siti Aminah");
    expect(susunStruk(data, toko, 58).some((b) => b.teks.includes("SALINAN"))).toBe(false);
  });

  it("byte diawali inisialisasi dan diakhiri perintah potong", () => {
    const byte = strukKeEscPos(data, toko, 58);
    expect(Array.from(byte.slice(0, 2))).toEqual([0x1b, 0x40]);
    expect(Array.from(byte.slice(-4))).toEqual([0x1d, 0x56, 0x42, 0x00]);
    expect(byte.every((b) => b <= 0x7f)).toBe(true);
  });
});
