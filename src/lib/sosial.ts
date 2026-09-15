import { nomorWhatsApp } from "@/lib/slip";

export type JenisSosial = "facebook" | "instagram" | "tiktok" | "youtube" | "website" | "whatsapp";

const DOMAIN: Record<Exclude<JenisSosial, "website" | "whatsapp">, string> = {
  facebook: "https://facebook.com/",
  instagram: "https://instagram.com/",
  tiktok: "https://www.tiktok.com/@",
  youtube: "https://youtube.com/@",
};

/**
 * Pengurus boleh mengisi alamat lengkap ("https://instagram.com/bkmt"),
 * alamat tanpa https ("instagram.com/bkmt"), atau cukup nama akun ("@bkmt").
 * Semuanya diubah menjadi tautan yang bisa dibuka. Isian yang tidak bisa
 * dipahami menghasilkan null supaya tidak tampil sebagai tautan rusak.
 */
export function tautanSosial(jenis: JenisSosial, nilai: string | null | undefined): string | null {
  const isi = nilai?.trim();
  if (!isi) return null;

  if (jenis === "whatsapp") {
    const nomor = nomorWhatsApp(isi);
    return nomor ? `https://wa.me/${nomor}` : null;
  }

  // Sudah berupa alamat web (dengan atau tanpa https).
  if (/^https?:\/\//i.test(isi)) return amanUrl(isi);
  const miripDomain = /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/|$)/i.test(isi);
  if (jenis === "website") return miripDomain ? amanUrl(`https://${isi}`) : null;
  // Nama akun Instagram boleh bertitik ("bkmt.kuburaya"), jadi isian tanpa
  // garis miring hanya dianggap alamat bila memuat nama platformnya.
  if (miripDomain && (isi.includes("/") || /(facebook|fb|instagram|tiktok|youtube|youtu)\./i.test(isi))) {
    return amanUrl(`https://${isi}`);
  }

  // Nama akun: buang "@" dan spasi.
  const akun = isi.replace(/^@+/, "").replace(/\s+/g, "");
  if (!/^[\w.\-]+$/.test(akun)) return null;
  return DOMAIN[jenis] + akun;
}

function amanUrl(teks: string): string | null {
  try {
    const u = new URL(teks);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

/** Tautan telepon: "0812-3456-7890" -> "tel:081234567890". */
export function tautanTelepon(nilai: string | null | undefined): string | null {
  const angka = nilai?.replace(/[^\d+]/g, "");
  return angka && angka.replace(/\D/g, "").length >= 6 ? `tel:${angka}` : null;
}

/** Nama yang ditampilkan untuk tautan web: tanpa https:// dan garis miring akhir. */
export function labelTautan(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");
}
