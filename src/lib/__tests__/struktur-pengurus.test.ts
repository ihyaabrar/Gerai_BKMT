import { describe, it, expect } from "vitest";
import { jenjangJabatan, perluBagan, susunStruktur } from "../struktur-pengurus";
import { sortPengurus } from "../utils";
import { parsePengurus } from "../validasi-pengurus";

describe("tingkat jabatan pengurus", () => {
  it("mengenali jabatan inti", () => {
    expect(jenjangJabatan("Ketua")).toBe("ketua");
    expect(jenjangJabatan("Wakil Ketua 1")).toBe("wakil");
    expect(jenjangJabatan("Sekretaris")).toBe("sekretaris");
    expect(jenjangJabatan("Bendahara 2")).toBe("bendahara");
    expect(jenjangJabatan("Penasehat")).toBe("penasehat");
    expect(jenjangJabatan("Pembina")).toBe("penasehat");
  });

  it("tetap mengenali salah ketik yang umum", () => {
    expect(jenjangJabatan("Penaashet")).toBe("penasehat");
    expect(jenjangJabatan("Penasihat")).toBe("penasehat");
    expect(jenjangJabatan("Sekretris 2")).toBe("sekretaris");
    expect(jenjangJabatan("Sekertaris")).toBe("sekretaris");
  });

  it("wakil sekretaris masuk kelompok sekretaris, bukan wakil ketua", () => {
    expect(jenjangJabatan("Wakil Sekretaris")).toBe("sekretaris");
    expect(jenjangJabatan("Wakil Bendahara")).toBe("bendahara");
  });

  it("jabatan lain masuk bidang & anggota", () => {
    expect(jenjangJabatan("Da'i PD. BKMT Kubu Raya")).toBe("lainnya");
    expect(jenjangJabatan("Seksi Dakwah")).toBe("lainnya");
    expect(jenjangJabatan("Anggota")).toBe("lainnya");
  });

  it("pimpinan cabang yang semuanya ketua tidak dijadikan bagan", () => {
    const pc = Array.from({ length: 9 }, (_, i) => ({ jabatan: `Ketua PC. BKMT Kecamatan ${i}` }));
    expect(perluBagan(susunStruktur(pc))).toBe(false);
  });

  it("pimpinan daerah dengan ketua dan jajarannya dijadikan bagan", () => {
    const pd = ["Penaashet", "Ketua", "Wakil Ketua 1", "Sekretaris", "Bendahara", "Da'i"].map((jabatan) => ({ jabatan }));
    const s = susunStruktur(pd);
    expect(perluBagan(s)).toBe(true);
    expect(s.ketua).toHaveLength(1);
    expect(s.penasehat).toHaveLength(1);
    expect(s.lainnya).toHaveLength(1);
  });
});

describe("ketua bidang dan urutan pengurus", () => {
  it("ketua bidang bukan ketua organisasi", () => {
    expect(jenjangJabatan("Ketua Bidang Dakwah")).toBe("lainnya");
    expect(jenjangJabatan("Koordinator Seksi Sosial")).toBe("lainnya");
    expect(jenjangJabatan("Ketua Umum")).toBe("ketua");
    expect(jenjangJabatan("Dewan Pembina")).toBe("penasehat");
  });

  it("daftar mengikuti tingkatan, tingkat bagan, Urutan Tampil, lalu nama", () => {
    const data = [
      { nama: "Wasilun", jabatan: "Da'i PD", tingkatan: "PD", urutan: 1 },
      { nama: "Haniah", jabatan: "Penaashet", tingkatan: "PD", urutan: 2 },
      { nama: "Romlah", jabatan: "Penasehat", tingkatan: "PD", urutan: 2 },
      { nama: "Tutik", jabatan: "Ketua PC Sungai Raya", tingkatan: "PC", urutan: 0 },
      { nama: "Qibtiyah", jabatan: "Ketua", tingkatan: "PD", urutan: 5 },
      { nama: "Seti", jabatan: "Wakil Ketua 1", tingkatan: "PD", urutan: 6 },
    ];
    expect(sortPengurus(data).map((p) => p.nama)).toEqual([
      "Haniah", "Romlah", "Qibtiyah", "Seti", "Wasilun", "Tutik",
    ]);
  });
});

describe("validasi form pengurus", () => {
  it("hanya kolom yang dikenal yang disimpan", () => {
    const data = parsePengurus({
      id: "palsu", createdAt: "x", nama: " Siti ", jabatan: "Ketua", tingkatan: "PD", urutan: "3", alamat: "",
    });
    expect(data).toEqual({ nama: "Siti", jabatan: "Ketua", tingkatan: "PD", urutan: 3, alamat: null });
  });

  it("urutan yang bukan angka ditolak dengan pesan jelas", () => {
    expect(() => parsePengurus({ nama: "A", jabatan: "B", tingkatan: "PD", urutan: "abc" })).toThrow(/Urutan Tampil/);
    expect(() => parsePengurus({ nama: "A", jabatan: "B", tingkatan: "PW" })).toThrow(/Tingkatan/);
  });
});

describe("pengurus per cabang", () => {
  it("pengurus satu cabang berkumpul, yang tanpa cabang di akhir", () => {
    const data = [
      { nama: "A", jabatan: "Sekretaris", tingkatan: "PC", urutan: 0, wilayah: "Sungai Raya" },
      { nama: "B", jabatan: "Ketua PC", tingkatan: "PC", urutan: 0, wilayah: "Kubu" },
      { nama: "C", jabatan: "Ketua PC", tingkatan: "PC", urutan: 0, wilayah: null },
      { nama: "D", jabatan: "Ketua PC", tingkatan: "PC", urutan: 0, wilayah: "Sungai Raya" },
    ];
    expect(sortPengurus(data).map((p) => p.nama)).toEqual(["B", "D", "A", "C"]);
  });

  it("cabang ikut disimpan dari form", () => {
    expect(parsePengurus({ nama: "A", jabatan: "Ketua", tingkatan: "PC", wilayah: " Kubu " }).wilayah).toBe("Kubu");
  });
});
