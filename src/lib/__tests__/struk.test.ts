import { describe, it, expect } from "vitest";
import { strukDariPenjualan } from "../struk";

const penjualan = {
  nomorTransaksi: "TRX1",
  tanggal: "2026-09-15T03:00:00.000Z",
  subtotal: 20_000,
  diskon: 1_000,
  total: 19_000,
  bayar: 20_000,
  kembalian: 1_000,
  member: { nama: "Aminah" },
  user: { nama: "Kasir Pagi" },
  detail: [{ qty: 2, hargaJual: 10_000, subtotal: 20_000, barang: { nama: "Gula" } }],
};

describe("data struk", () => {
  it("cetak ulang memakai nama kasir yang melayani, bukan yang sedang login", () => {
    const s = strukDariPenjualan(penjualan, { kasir: "Admin", salinan: true });
    expect(s.kasir).toBe("Kasir Pagi");
    expect(s.salinan).toBe(true);
  });

  it("transaksi baru di kasir memakai nama pengguna yang login", () => {
    const { user: _user, ...tanpaUser } = penjualan;
    expect(strukDariPenjualan(tanpaUser, { kasir: "Kasir Sore" }).kasir).toBe("Kasir Sore");
  });

  it("angka struk diambil apa adanya dari penjualan", () => {
    const s = strukDariPenjualan(penjualan);
    expect(s.items).toEqual([{ nama: "Gula", qty: 2, harga: 10_000, subtotal: 20_000 }]);
    expect([s.subtotal, s.diskon, s.total, s.kembalian]).toEqual([20_000, 1_000, 19_000, 1_000]);
    expect(s.member).toBe("Aminah");
  });
});
