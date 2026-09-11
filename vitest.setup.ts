/**
 * localStorage tidak ada di lingkungan Node, sementara store zustand memakai
 * `persist`. Tanpa pengganti ini setiap perubahan state mencetak peringatan
 * yang menenggelamkan hasil uji yang sebenarnya.
 */
const penyimpanan = new Map<string, string>();

const localStorageTiruan: Storage = {
  get length() {
    return penyimpanan.size;
  },
  clear: () => penyimpanan.clear(),
  getItem: (kunci) => penyimpanan.get(kunci) ?? null,
  key: (indeks) => Array.from(penyimpanan.keys())[indeks] ?? null,
  removeItem: (kunci) => void penyimpanan.delete(kunci),
  setItem: (kunci, nilai) => void penyimpanan.set(kunci, String(nilai)),
};

globalThis.localStorage = localStorageTiruan;
