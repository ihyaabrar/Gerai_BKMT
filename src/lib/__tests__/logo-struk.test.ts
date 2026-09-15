import { describe, expect, it } from "vitest";
import { rasterDariPiksel } from "@/lib/logo-struk";
import { perintahRaster, strukKeEscPos, susunStruk, FOOTER_BAWAAN } from "@/lib/escpos";
import type { DataStruk } from "@/lib/struk";

function piksel(lebar: number, tinggi: number, isi: (x: number, y: number) => [number, number, number, number]) {
  const d = new Uint8ClampedArray(lebar * tinggi * 4);
  for (let y = 0; y < tinggi; y++)
    for (let x = 0; x < lebar; x++) d.set(isi(x, y), (y * lebar + x) * 4);
  return d;
}

describe("raster logo", () => {
  it("hitam penuh jadi bit 1, putih dan transparan jadi 0", () => {
    const hitam = rasterDariPiksel(piksel(8, 2, () => [0, 0, 0, 255]), 8, 2);
    expect(Array.from(hitam.data)).toEqual([0xff, 0xff]);
    const putih = rasterDariPiksel(piksel(8, 1, () => [255, 255, 255, 255]), 8, 1);
    expect(Array.from(putih.data)).toEqual([0]);
    const bening = rasterDariPiksel(piksel(8, 1, () => [0, 0, 0, 0]), 8, 1);
    expect(Array.from(bening.data)).toEqual([0]);
  });

  it("lebar dibulatkan ke kelipatan 8", () => {
    const r = rasterDariPiksel(piksel(10, 1, () => [0, 0, 0, 255]), 10, 1);
    expect(r.lebar).toBe(16);
    expect(Array.from(r.data)).toEqual([0xff, 0xc0]);
  });

  it("abu-abu 50% jadi pola titik kira-kira separuh", () => {
    const r = rasterDariPiksel(piksel(16, 16, () => [128, 128, 128, 255]), 16, 16);
    const bit = Array.from(r.data).reduce((n, b) => n + b.toString(2).split("1").length - 1, 0);
    expect(bit).toBeGreaterThan(256 * 0.35);
    expect(bit).toBeLessThan(256 * 0.65);
  });

  it("perintah GS v 0 memuat ukuran dalam byte", () => {
    const b = perintahRaster({ lebar: 16, tinggi: 300, data: new Uint8Array(600) });
    expect(b.slice(0, 11)).toEqual([0x1b, 0x61, 1, 0x1d, 0x76, 0x30, 0, 2, 0, 300 & 0xff, 1]);
    expect(b.length).toBe(11 + 600 + 1);
  });
});

describe("teks tambahan struk", () => {
  const data: DataStruk = {
    nomorTransaksi: "T1",
    tanggal: new Date(2026, 0, 1, 8, 0),
    items: [{ nama: "Teh", qty: 1, harga: 5000, subtotal: 5000 }],
    subtotal: 5000,
    diskon: 0,
    total: 5000,
    bayar: 5000,
    kembalian: 0,
    kasir: "K",
  };
  const toko = { nama: "Gerai", alamat: "", telepon: "" };

  it("header tampil di bawah identitas, footer mengganti ucapan bawaan", () => {
    const teks = susunStruk(data, { ...toko, header: "Milik PD BKMT\nKubu Raya", footer: "Jazakallah khairan" }, 58).map((b) => b.teks);
    expect(teks.indexOf("Milik PD BKMT")).toBe(1);
    expect(teks[2]).toBe("Kubu Raya");
    expect(teks[teks.length - 1]).toBe("Jazakallah khairan");
    expect(teks).not.toContain("Terima Kasih");
  });

  it("footer kosong memakai ucapan bawaan", () => {
    const teks = susunStruk(data, { ...toko, footer: "   " }, 58).map((b) => b.teks);
    expect(teks.slice(-2)).toEqual(FOOTER_BAWAAN.split("\n"));
  });

  it("logo dikirim sebelum teks struk", () => {
    const tanpa = strukKeEscPos(data, toko, 58);
    const dengan = strukKeEscPos(data, toko, 58, { lebar: 8, tinggi: 1, data: new Uint8Array([0xff]) });
    expect(dengan.length).toBe(tanpa.length + 13);
    expect(Array.from(dengan.slice(2, 8))).toEqual([0x1b, 0x61, 1, 0x1d, 0x76, 0x30]);
  });
});
