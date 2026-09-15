import { describe, it, expect } from "vitest";
import { identitasDariPengaturan, strukHtml } from "../cetak";
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

describe("tampilan struk dari pengaturan", () => {
  const dasar = { namaToko: "Gerai BKMT", alamatToko: "Jl. Arteri", teleponToko: "0561" };

  it("logo hanya dipakai bila diaktifkan; logo khusus struk didahulukan", () => {
    expect(identitasDariPengaturan({ ...dasar, strukLogo: false, logoOrganisasi: "https://x/a.png" }).logoUrl).toBeNull();
    expect(identitasDariPengaturan({ ...dasar, strukLogo: true, logoOrganisasi: "https://x/a.png" }).logoUrl).toBe("https://x/a.png");
    expect(
      identitasDariPengaturan({ ...dasar, strukLogo: true, strukLogoUrl: "https://x/b.png", logoOrganisasi: "https://x/a.png" }).logoUrl
    ).toBe("https://x/b.png");
    expect(identitasDariPengaturan({ ...dasar, strukLogo: true }).logoUrl).toBeNull();
  });

  it("teks atas dan bawah ikut terbawa", () => {
    const t = identitasDariPengaturan({ ...dasar, strukHeader: " Milik PD BKMT ", strukFooter: "Jazakallah" });
    expect(t.header).toBe("Milik PD BKMT");
    expect(t.footer).toBe("Jazakallah");
  });

  it("logo ikut di HTML printer sistem dan alamatnya aman", () => {
    const html = strukHtml(data, { ...toko, logoUrl: 'https://x/a.png"onerror="alert(1)' }, 58);
    expect(html).toContain("<img");
    expect(html).not.toContain('"onerror="');
    expect(strukHtml(data, toko, 58)).not.toContain("<img");
  });
});
