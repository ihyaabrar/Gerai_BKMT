import { create } from "zustand";

/**
 * Logo organisasi untuk tampilan di sisi klien.
 *
 * Halaman /app dan /admin dirender statis saat build. Mengambil logo dari
 * database di layout-nya membuat nilainya ikut dibekukan ke dalam HTML: logo
 * yang diganti pengurus baru muncul setelah deploy berikutnya — persis
 * masalah yang ingin diperbaiki, hanya bentuknya lebih halus dan lebih sulit
 * disadari.
 *
 * Diambil di sisi klien supaya halamannya tetap statis (cepat, tanpa query
 * database per kunjungan) sementara logonya selalu yang terbaru.
 *
 * Halaman publik (/ dan /berita) tidak memakai ini — keduanya memang
 * dirender per request, jadi mengambilnya di server sudah benar dan
 * menghemat satu permintaan.
 */
interface IdentitasState {
  logoUrl: string | null;
  /** Dipakai sebagai penjaga supaya beberapa komponen tidak mengambil berulang. */
  sedangDimuat: boolean;
  muat: () => Promise<void>;
}

export const useIdentitasStore = create<IdentitasState>((set, get) => ({
  logoUrl: null,
  sedangDimuat: false,

  muat: async () => {
    if (get().sedangDimuat) return;
    set({ sedangDimuat: true });

    try {
      const res = await fetch("/api/public/profil");
      if (!res.ok) return;
      const data = await res.json();
      set({ logoUrl: data?.data?.logoUrl ?? null });
    } catch {
      // Logo hanya hiasan. Kegagalannya tidak boleh mengganggu apa pun —
      // setiap tempat yang memakainya punya lambang cadangan.
    }
  },
}));
