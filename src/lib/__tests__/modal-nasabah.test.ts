import { describe, it, expect } from "vitest";
import { modalBerlaku, periodePerubahan } from "../modal-nasabah";

const b = (nasabahId: string, berlakuMulai: string, jumlah: number, aktif = true) => ({
  nasabahId,
  berlakuMulai,
  jumlah,
  aktif,
});

describe("modal nasabah per periode", () => {
  it("nasabah yang bergabung bulan ini baru ikut bulan depan", () => {
    const baris = [b("baru", "2026-10", 5_000_000)];
    expect(modalBerlaku(baris, "2026-09").has("baru")).toBe(false);
    expect(modalBerlaku(baris, "2026-10").get("baru")?.jumlah).toBe(5_000_000);
  });

  it("perubahan modal dipakai mulai periodenya, periode sebelumnya tetap modal lama", () => {
    const baris = [b("a", "2000-01", 10_000_000), b("a", "2026-10", 15_000_000)];
    expect(modalBerlaku(baris, "2026-09").get("a")?.jumlah).toBe(10_000_000);
    expect(modalBerlaku(baris, "2026-10").get("a")?.jumlah).toBe(15_000_000);
    expect(modalBerlaku(baris, "2027-03").get("a")?.jumlah).toBe(15_000_000);
  });

  it("nasabah yang berhenti masih ikut bulan terakhirnya", () => {
    const baris = [b("a", "2000-01", 10_000_000), b("a", "2026-10", 10_000_000, false)];
    expect(modalBerlaku(baris, "2026-09").get("a")?.aktif).toBe(true);
    expect(modalBerlaku(baris, "2026-10").get("a")?.aktif).toBe(false);
  });

  it("urutan baris dari database tidak memengaruhi hasil", () => {
    const baris = [b("a", "2026-10", 2), b("a", "2000-01", 1), b("a", "2026-08", 3)];
    expect(modalBerlaku(baris, "2026-09").get("a")?.jumlah).toBe(3);
  });

  it("perubahan hari ini berlaku bulan berikutnya menurut kalender WIB", () => {
    // 30 September 23.30 WIB masih September → berlaku Oktober.
    expect(periodePerubahan(new Date("2026-09-30T16:30:00Z"))).toBe("2026-10");
    // 1 Oktober 06.30 WIB sudah Oktober → berlaku November.
    expect(periodePerubahan(new Date("2026-09-30T23:30:00Z"))).toBe("2026-11");
  });
});
