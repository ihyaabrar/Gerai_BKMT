import { describe, it, expect } from "vitest";
import { gambarLebar, LEBAR } from "../gambar";

const ASLI =
  "https://res.cloudinary.com/demo-bkmt/image/upload/v1789012345/bkmt/produk/madu.jpg";

describe("gambarLebar", () => {
  it("menyisipkan transformasi setelah /upload", () => {
    expect(gambarLebar(ASLI, 320)).toBe(
      "https://res.cloudinary.com/demo-bkmt/image/upload/w_320,c_limit,q_auto,f_auto/v1789012345/bkmt/produk/madu.jpg"
    );
  });

  it("tidak menumpuk transformasi pada URL yang sudah punya", () => {
    const sekali = gambarLebar(ASLI, 320);
    expect(gambarLebar(sekali, 640)).toBe(sekali);
  });

  it("membiarkan URL non-Cloudinary apa adanya", () => {
    expect(gambarLebar("/images/masjid.webp", 320)).toBe("/images/masjid.webp");
    expect(gambarLebar("https://contoh.com/foto.png", 320)).toBe(
      "https://contoh.com/foto.png"
    );
  });

  it("mengembalikan string kosong untuk nilai kosong", () => {
    expect(gambarLebar(null, 320)).toBe("");
    expect(gambarLebar(undefined, 320)).toBe("");
    expect(gambarLebar("", 320)).toBe("");
  });

  it("bekerja pada URL http maupun https", () => {
    const http = ASLI.replace("https://", "http://");
    expect(gambarLebar(http, 96)).toContain("/upload/w_96,c_limit,q_auto,f_auto/");
  });

  it("menangani folder bersarang dan nama berkas dengan titik", () => {
    const bersarang =
      "https://res.cloudinary.com/demo-bkmt/image/upload/v1/bkmt/galeri/2026/kegiatan.akhir.tahun.jpg";
    expect(gambarLebar(bersarang, LEBAR.sedang)).toBe(
      "https://res.cloudinary.com/demo-bkmt/image/upload/w_640,c_limit,q_auto,f_auto/v1/bkmt/galeri/2026/kegiatan.akhir.tahun.jpg"
    );
  });

  it("ukuran baku tersusun dari kecil ke besar", () => {
    const urut = [LEBAR.ikon, LEBAR.kartu, LEBAR.pratinjau, LEBAR.sedang, LEBAR.besar];
    expect(urut).toEqual([...urut].sort((a, b) => a - b));
  });
});
