import { describe, it, expect } from "vitest";
import { strukHtml } from "../cetak";
import type { DataStruk } from "../struk";

const data: DataStruk = {
  nomorTransaksi: "TRX1",
  tanggal: new Date(2026, 8, 15, 9, 0),
  items: [{ nama: "Kopi <Spesial> & Gula", qty: 1, harga: 5_000, subtotal: 5_000 }],
  subtotal: 5_000,
  diskon: 0,
  total: 5_000,
  bayar: 5_000,
  kembalian: 0,
  kasir: "Kasir 1",
};
const toko = { nama: "Gerai BKMT", alamat: "", telepon: "" };

describe("struk untuk printer sistem", () => {
  it("ukuran halaman mengikuti lebar kertas", () => {
    expect(strukHtml(data, toko, 58)).toContain("size: 58mm auto");
    expect(strukHtml(data, toko, 80)).toContain("size: 80mm auto");
  });

  it("nama barang tidak bisa menyisipkan HTML", () => {
    const html = strukHtml(data, toko, 58);
    expect(html).toContain("Kopi &lt;Spesial&gt; &amp; Gula");
    expect(html).not.toContain("<Spesial>");
  });
});
