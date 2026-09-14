import { describe, it, expect } from "vitest";
import {
  awalHariWIB,
  akhirHariWIB,
  periodeDari,
  periodeValid,
  stempelWIB,
  tanggalWIB,
  rentangPeriode,
  labelPeriode,
  hitungLaba,
  labaTransaksi,
  bagiRata,
  bagiHasil,
  hitungKerugianStok,
  hargaBeliRataRata,
} from "../keuangan";

const baris = (qty: number, hargaBeli: number) => ({ qty, hargaBeli });

describe("periode WIB", () => {
  it("transaksi pukul 06.30 WIB tanggal 1 masuk ke bulan yang benar", () => {
    // 2026-08-31T23:30:00Z = 2026-09-01 06:30 WIB
    expect(periodeDari(new Date("2026-08-31T23:30:00.000Z"))).toBe("2026-09");
  });

  it("transaksi pukul 23.30 WIB tanggal terakhir belum masuk bulan berikutnya", () => {
    // 2026-09-30T16:30:00Z = 2026-09-30 23:30 WIB
    expect(periodeDari(new Date("2026-09-30T16:30:00.000Z"))).toBe("2026-09");
  });

  it("rentang periode menutup seluruh bulan tanpa celah", () => {
    const { mulai, selesai } = rentangPeriode("2026-09");
    expect(mulai.toISOString()).toBe("2026-08-31T17:00:00.000Z"); // 1 Sep 00:00 WIB
    expect(selesai.toISOString()).toBe("2026-09-30T16:59:59.999Z"); // 30 Sep 23:59:59.999 WIB

    const berikutnya = rentangPeriode("2026-10");
    expect(berikutnya.mulai.getTime() - selesai.getTime()).toBe(1);
  });

  it("awal dan akhir hari WIB konsisten", () => {
    const t = new Date("2026-09-10T02:15:00.000Z"); // 09:15 WIB
    expect(awalHariWIB(t).toISOString()).toBe("2026-09-09T17:00:00.000Z");
    expect(akhirHariWIB(t).toISOString()).toBe("2026-09-10T16:59:59.999Z");
  });

  it("tanggal WIB tidak mundur satu hari", () => {
    // 2026-09-10 09:15 WIB — dulu grafik laporan menaruhnya di tanggal 9.
    expect(tanggalWIB(new Date("2026-09-10T02:15:00.000Z"))).toBe("2026-09-10");
    // 06.30 WIB tanggal 1 masih tanggal 1, bukan 31 bulan lalu.
    expect(tanggalWIB(new Date("2026-08-31T23:30:00.000Z"))).toBe("2026-09-01");
    // 23.59 WIB tetap hari yang sama.
    expect(tanggalWIB(new Date("2026-09-10T16:59:59.999Z"))).toBe("2026-09-10");
  });

  it("stempel nomor transaksi memakai jam WIB", () => {
    // 2026-08-31T23:30:05Z = 1 September 2026 06:30:05 WIB
    expect(stempelWIB(new Date("2026-08-31T23:30:05.000Z"))).toBe("20260901063005");
  });

  it("memvalidasi format periode", () => {
    expect(periodeValid("2026-09")).toBe(true);
    expect(periodeValid("2026-13")).toBe(false);
    expect(periodeValid("2026-9")).toBe(false);
    expect(periodeValid("")).toBe(false);
    expect(periodeValid(null)).toBe(false);
  });

  it("melabeli periode dalam bahasa Indonesia", () => {
    expect(labelPeriode("2026-09")).toBe("September 2026");
  });
});

describe("laba", () => {
  it("memakai harga pokok yang dibekukan, bukan harga beli hari ini", () => {
    const p = { total: 50_000, diskon: 0, detail: [baris(5, 6_000)] };
    expect(labaTransaksi(p)).toBe(20_000);
  });

  it("diskon member mengurangi laba", () => {
    // Subtotal 100.000, diskon 5%, HPP 70.000.
    const tanpaDiskon = { total: 100_000, diskon: 0, detail: [baris(10, 7_000)] };
    const denganDiskon = { total: 95_000, diskon: 5_000, detail: [baris(10, 7_000)] };

    expect(labaTransaksi(tanpaDiskon)).toBe(30_000);
    expect(labaTransaksi(denganDiskon)).toBe(25_000);
  });

  it("meringkas banyak transaksi", () => {
    const ringkasan = hitungLaba([
      { total: 95_000, diskon: 5_000, detail: [baris(10, 7_000)] },
      { total: 30_000, diskon: 0, detail: [baris(2, 10_000)] },
    ]);

    expect(ringkasan.totalPenjualan).toBe(125_000);
    expect(ringkasan.totalHpp).toBe(90_000);
    expect(ringkasan.totalDiskon).toBe(5_000);
    expect(ringkasan.labaKotor).toBe(35_000);
  });

  it("rugi tetap dilaporkan sebagai angka negatif", () => {
    const ringkasan = hitungLaba([{ total: 5_000, diskon: 0, detail: [baris(1, 8_000)] }]);
    expect(ringkasan.labaKotor).toBe(-3_000);
  });
});

describe("bagiRata", () => {
  it("jumlah seluruh bagian selalu persis sama dengan total", () => {
    const bagian = bagiRata(1_000_000, [1, 1, 1]);
    expect(bagian.reduce((a, b) => a + b, 0)).toBe(1_000_000);
    expect(bagian).toEqual([333_334, 333_333, 333_333]);
  });

  it("membagi menurut bobot investasi", () => {
    const bagian = bagiRata(300_000, [5_000_000, 3_000_000, 2_000_000]);
    expect(bagian).toEqual([150_000, 90_000, 60_000]);
    expect(bagian.reduce((a, b) => a + b, 0)).toBe(300_000);
  });

  it("tetap berjumlah tepat pada angka yang tidak habis dibagi", () => {
    for (const total of [1, 7, 99, 12_345, 999_999]) {
      for (const bobot of [[1, 1, 1], [7, 3], [1, 1, 1, 1, 1, 1, 1]]) {
        const bagian = bagiRata(total, bobot);
        expect(bagian.reduce((a, b) => a + b, 0)).toBe(total);
      }
    }
  });

  it("bekerja pada total negatif (bulan rugi)", () => {
    const bagian = bagiRata(-100, [1, 1, 1]);
    expect(bagian.reduce((a, b) => a + b, 0)).toBe(-100);
  });

  it("mengembalikan nol bila belum ada investasi", () => {
    expect(bagiRata(500_000, [0, 0])).toEqual([0, 0]);
    expect(bagiRata(500_000, [])).toEqual([]);
  });
});

describe("bagiHasil", () => {
  it("bagian nasabah dan pengelola selalu berjumlah laba kotor", () => {
    for (const laba of [1_000_000, 999_999, 7, 0, -50_000]) {
      const { bagianNasabah, bagianPengelola } = bagiHasil(laba, 30);
      expect(bagianNasabah + bagianPengelola).toBe(Math.round(laba));
    }
  });

  it("memakai rasio 30/70 sebagaimana kesepakatan", () => {
    expect(bagiHasil(1_000_000, 30)).toEqual({
      bagianNasabah: 300_000,
      bagianPengelola: 700_000,
    });
  });

  it("skenario lengkap: laba 1 juta dibagi tiga nasabah", () => {
    const { bagianNasabah } = bagiHasil(1_000_000, 30);
    const investasi = [5_000_000, 3_000_000, 2_000_000];
    const bagian = bagiRata(bagianNasabah, investasi);

    expect(bagian).toEqual([150_000, 90_000, 60_000]);
    expect(bagian.reduce((a, b) => a + b, 0)).toBe(bagianNasabah);
  });
});

describe("kerugian stok", () => {
  it("nilai barang rusak = harga beli x jumlah", () => {
    expect(hitungKerugianStok([{ jenis: "keluar", qty: 3, hargaBeli: 4_500 }])).toBe(13_500);
  });

  it("penyesuaian masuk mengoreksi kerugian bulan yang sama", () => {
    expect(
      hitungKerugianStok([
        { jenis: "keluar", qty: 5, hargaBeli: 4_000 },
        { jenis: "masuk", qty: 2, hargaBeli: 4_000 },
      ])
    ).toBe(12_000);
  });

  it("penyesuaian masuk tidak pernah menambah laba", () => {
    expect(hitungKerugianStok([{ jenis: "masuk", qty: 100, hargaBeli: 4_000 }])).toBe(0);
  });

  it("baris tanpa harga beli dianggap nol", () => {
    expect(hitungKerugianStok([{ jenis: "keluar", qty: 3, hargaBeli: null }])).toBe(0);
  });
});

describe("harga beli rata-rata", () => {
  it("rata-rata tertimbang menurut jumlah", () => {
    expect(hargaBeliRataRata(10, 4_000, 10, 5_000)).toBe(4_500);
    expect(hargaBeliRataRata(30, 4_000, 10, 8_000)).toBe(5_000);
  });

  it("dibulatkan ke rupiah", () => {
    // (2 x 1.000 + 1 x 2.000) / 3 = 1.333,33
    expect(hargaBeliRataRata(2, 1_000, 1, 2_000)).toBe(1_333);
  });

  it("stok kosong memakai harga pembelian baru", () => {
    expect(hargaBeliRataRata(0, 4_000, 10, 5_000)).toBe(5_000);
    expect(hargaBeliRataRata(-3, 4_000, 10, 5_000)).toBe(5_000);
  });

  it("pembelian dengan harga sama tidak mengubah harga", () => {
    expect(hargaBeliRataRata(7, 4_000, 3, 4_000)).toBe(4_000);
  });
});
