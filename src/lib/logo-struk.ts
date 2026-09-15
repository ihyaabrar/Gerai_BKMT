import { gambarLebar } from "@/lib/gambar";
import type { LebarKertas, RasterLogo } from "@/lib/escpos";

/**
 * Logo untuk printer thermal Bluetooth.
 *
 * Printer thermal hanya bisa mencetak titik hitam, jadi gambar diubah menjadi
 * hitam-putih dengan dithering (Floyd–Steinberg): bagian abu-abu dan warna
 * menjadi pola titik, bukan hilang atau menjadi blok hitam.
 */

/** Lebar logo dalam titik. Kertas 58 mm = 384 titik, 80 mm = 576 titik. */
export const LEBAR_LOGO: Record<LebarKertas, number> = { 58: 240, 80: 320 };

/**
 * Piksel RGBA -> raster 1 bit. Latar transparan dianggap putih. Lebar
 * dibulatkan ke atas ke kelipatan 8 (sisa kolom diisi putih).
 */
export function rasterDariPiksel(rgba: Uint8ClampedArray | Uint8Array, lebar: number, tinggi: number): RasterLogo {
  const lebarByte = Math.ceil(lebar / 8);
  const abu = new Float32Array(lebar * tinggi);
  for (let i = 0; i < lebar * tinggi; i++) {
    const r = rgba[i * 4], g = rgba[i * 4 + 1], b = rgba[i * 4 + 2];
    const a = rgba[i * 4 + 3] / 255;
    const terang = 0.299 * r + 0.587 * g + 0.114 * b;
    abu[i] = terang * a + 255 * (1 - a);
  }

  const data = new Uint8Array(lebarByte * tinggi);
  for (let y = 0; y < tinggi; y++) {
    for (let x = 0; x < lebar; x++) {
      const i = y * lebar + x;
      const hitam = abu[i] < 128;
      const galat = abu[i] - (hitam ? 0 : 255);
      if (hitam) data[y * lebarByte + (x >> 3)] |= 0x80 >> (x & 7);
      if (x + 1 < lebar) abu[i + 1] += (galat * 7) / 16;
      if (y + 1 < tinggi) {
        if (x > 0) abu[i + lebar - 1] += (galat * 3) / 16;
        abu[i + lebar] += (galat * 5) / 16;
        if (x + 1 < lebar) abu[i + lebar + 1] += galat / 16;
      }
    }
  }
  return { lebar: lebarByte * 8, tinggi, data };
}

const cache = new Map<string, Promise<RasterLogo | null>>();

/**
 * Unduh logo dan ubah jadi raster (hanya di browser). Gagal memuat logo tidak
 * boleh menggagalkan cetak struk — hasilnya null dan struk dicetak tanpa logo.
 */
export function muatLogoRaster(url: string, lebarKertas: LebarKertas): Promise<RasterLogo | null> {
  const lebar = LEBAR_LOGO[lebarKertas];
  const kunci = `${url}|${lebar}`;
  let janji = cache.get(kunci);
  if (!janji) {
    janji = muat(url, lebar).catch(() => null);
    cache.set(kunci, janji);
    // Kegagalan tidak disimpan, supaya dicoba lagi pada cetak berikutnya.
    janji.then((hasil) => {
      if (!hasil) cache.delete(kunci);
    });
  }
  return janji;
}

async function muat(url: string, lebar: number): Promise<RasterLogo | null> {
  if (typeof document === "undefined") return null;
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.decoding = "async";
  await new Promise<void>((selesai, gagal) => {
    img.onload = () => selesai();
    img.onerror = () => gagal(new Error("Logo tidak bisa dimuat"));
    img.src = gambarLebar(url, lebar * 2);
  });
  if (!img.naturalWidth) return null;

  const skala = Math.min(1, lebar / img.naturalWidth);
  const w = Math.max(8, Math.round(img.naturalWidth * skala));
  // Logo sangat tinggi dibatasi supaya struk tidak boros kertas.
  const h = Math.min(Math.round(img.naturalHeight * skala), lebar);
  const kanvas = document.createElement("canvas");
  kanvas.width = w;
  kanvas.height = h;
  const ctx = kanvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return rasterDariPiksel(ctx.getImageData(0, 0, w, h).data, w, h);
}
