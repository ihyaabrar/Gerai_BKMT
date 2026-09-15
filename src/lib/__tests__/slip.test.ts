import { describe, it, expect } from "vitest";
import { nomorWhatsApp, pesanWhatsApp, slipHtml, type DataSlip } from "../slip";

const slip = (nama: string, bagian: number): DataSlip => ({
  periode: "2026-09",
  label: "September 2026",
  ditutupPada: "2026-10-02T03:00:00.000Z",
  ditutupOleh: "Admin Master",
  totalPenjualan: 1_000_000,
  totalHpp: 600_000,
  totalRetur: 19_000,
  hppRetur: 12_000,
  labaKotor: 393_000,
  kerugianStok: 13_000,
  persenNasabah: 30,
  bagianNasabah: 114_000,
  totalInvestasi: 10_000_000,
  nasabah: {
    nasabahId: nama,
    nama,
    telepon: "0812-3456-7890",
    jumlahInvestasi: 6_000_000,
    persentase: 60,
    bagian,
  },
});
const org = { namaGerai: "Gerai BKMT", namaOrganisasi: "PD BKMT Kubu Raya", alamat: "", telepon: "" };

describe("nomor WhatsApp", () => {
  it("nomor lokal menjadi format internasional", () => {
    expect(nomorWhatsApp("0812-3456-7890")).toBe("6281234567890");
    expect(nomorWhatsApp("+62 812 3456 7890")).toBe("6281234567890");
    expect(nomorWhatsApp("81234567890")).toBe("6281234567890");
  });

  it("nomor kosong atau tidak masuk akal ditolak", () => {
    expect(nomorWhatsApp(null)).toBeNull();
    expect(nomorWhatsApp("")).toBeNull();
    expect(nomorWhatsApp("12345")).toBeNull();
    expect(nomorWhatsApp("021")).toBeNull();
  });
});

describe("slip bagi hasil", () => {
  it("pesan WhatsApp memuat periode, laba dibagi, dan bagian nasabah", () => {
    const pesan = pesanWhatsApp(slip("Siti Aminah", 68_400), org);
    expect(pesan).toContain("Siti Aminah");
    expect(pesan).toContain("September 2026");
    expect(pesan).toMatch(/Laba yang dibagi: Rp\s380\.000/);
    expect(pesan).toMatch(/Bagian Anda: Rp\s68\.400/);
  });

  it("satu halaman per nasabah saat mencetak semua slip", () => {
    const html = slipHtml([slip("A", 1), slip("B", 2), slip("C", 3)], org);
    expect(html.match(/<section class="slip">/g)).toHaveLength(3);
    expect(html).toContain("size: A5 portrait");
  });

  it("nama nasabah tidak bisa menyisipkan HTML", () => {
    const html = slipHtml([slip('<img src=x onerror="alert(1)">', 1)], org);
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });

  it("baris retur dan barang rusak hanya muncul bila ada", () => {
    const tanpa = { ...slip("A", 1), totalRetur: 0, hppRetur: 0, kerugianStok: 0 };
    const html = slipHtml([tanpa], org);
    expect(html).not.toContain("Retur pembeli");
    expect(html).not.toContain("Barang rusak");
    expect(slipHtml([slip("A", 1)], org)).toContain("Barang rusak");
  });
});
