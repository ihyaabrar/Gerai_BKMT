import { prisma } from "@/lib/prisma";

/**
 * Identitas organisasi yang dipakai untuk menandai seluruh tampilan.
 *
 * Sebelumnya logo yang diunggah pengurus hanya mengalir ke satu tempat —
 * header beranda publik — sementara halaman login, sidebar aplikasi, panel
 * admin, dan halaman berita memakai lambang yang ditulis langsung di kode.
 * Mengganti logo terasa "tidak berfungsi" karena empat dari lima tempat
 * memang tidak pernah membacanya.
 */
export interface Identitas {
  nama: string;
  singkatan: string;
  logoUrl: string | null;
}

const BAWAAN: Identitas = {
  nama: "PD BKMT Kabupaten Kubu Raya",
  singkatan: "BKMT",
  logoUrl: null,
};

/**
 * Dibaca dari database; bila gagal (mis. database sedang tidur) tampilan
 * tetap muncul dengan identitas bawaan alih-alih menggagalkan seluruh
 * halaman hanya karena logo.
 */
export async function ambilIdentitas(): Promise<Identitas> {
  try {
    const profil = await prisma.profilOrganisasi.findFirst({
      select: { nama: true, singkatan: true, logoUrl: true },
    });

    if (!profil) return BAWAAN;

    return {
      nama: profil.nama || BAWAAN.nama,
      singkatan: profil.singkatan || BAWAAN.singkatan,
      logoUrl: profil.logoUrl || null,
    };
  } catch {
    return BAWAAN;
  }
}
