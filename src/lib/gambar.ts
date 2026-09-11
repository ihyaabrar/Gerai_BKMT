/**
 * Penyesuaian ukuran gambar Cloudinary di sisi URL.
 *
 * Foto produk diunggah dari kamera HP — 3000×4000 piksel, 2–4 MB — lalu
 * ditampilkan di kartu selebar 150 piksel. Halaman kasir dengan 300 SKU
 * berarti puluhan megabyte sekali buka, di jaringan kabupaten, setiap pagi
 * saat toko buka.
 *
 * Transformasi ditempelkan ke URL, bukan saat unggah, supaya foto yang
 * TERLANJUR diunggah ukuran penuh ikut mengecil tanpa perlu diunggah ulang.
 */

const POLA_UPLOAD = /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload)\/(.+)$/;

/**
 * Mengembalikan URL gambar yang dibatasi `lebar` piksel.
 *
 * `c_limit` hanya memperkecil, tidak pernah memperbesar — gambar yang memang
 * sudah kecil dibiarkan apa adanya. `q_auto` dan `f_auto` membiarkan
 * Cloudinary memilih kualitas dan format (WebP/AVIF) sesuai peramban.
 *
 * URL non-Cloudinary (mis. berkas di /images) dikembalikan tanpa diubah.
 */
export function gambarLebar(url: string | null | undefined, lebar: number): string {
  if (!url) return "";

  const cocok = url.match(POLA_UPLOAD);
  if (!cocok) return url;

  const [, awalan, sisa] = cocok;

  // Sudah pernah diberi transformasi lebar — jangan ditumpuk.
  if (/(^|\/)(w_\d+|c_limit)/.test(sisa.split("/")[0])) return url;

  return `${awalan}/w_${lebar},c_limit,q_auto,f_auto/${sisa}`;
}

/** Ukuran yang dipakai berulang, supaya tidak ditebak-tebak di tiap halaman. */
export const LEBAR = {
  /** Ikon kecil di daftar dan tabel. */
  ikon: 96,
  /** Kartu produk di halaman kasir dan inventori. */
  kartu: 320,
  /** Pratinjau pada form unggah. */
  pratinjau: 480,
  /** Kartu galeri, berita, dan pengurus. */
  sedang: 640,
  /** Gambar utama pada halaman detail. */
  besar: 1200,
} as const;
