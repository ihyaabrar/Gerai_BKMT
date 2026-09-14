import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';

interface CartItem {
  id: string;
  kode: string;
  nama: string;
  hargaJual: number;
  qty: number;
  subtotal: number;
  stok: number;
}

/**
 * Kunci idempotensi dibuat sekali per keranjang dan ikut dikirim ke server.
 * Kalau respons hilang di jalan dan kasir menekan Bayar lagi, server mengenali
 * kunci yang sama dan mengembalikan transaksi yang sudah ada — bukan membuat
 * transaksi kedua.
 *
 * Kunci hanya berlaku untuk ISI keranjang yang sama persis. Begitu barang,
 * jumlah, member, atau metode bayar berubah, kuncinya dibuang. Tanpa itu,
 * skenario ini terjadi: sinyal putus setelah Bayar, pembeli menambah barang,
 * kasir menekan Bayar lagi — dan server mengembalikan transaksi LAMA tanpa
 * barang tambahan, sementara layar menulis "berhasil".
 */
function kunciBaru(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `k-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

interface CartStore {
  items: CartItem[];
  memberId: string | null;
  diskon: number;
  idempotencyKey: string | null;
  addItem: (item: Omit<CartItem, 'qty' | 'subtotal'>) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  setMember: (memberId: string | null, diskon: number) => void;
  /** Kunci untuk keranjang saat ini; dibuat saat pertama kali dibutuhkan. */
  ambilKunci: () => string;
  /** Dipanggil saat hal di luar keranjang yang ikut menentukan transaksi berubah (metode bayar). */
  resetKunci: () => void;
  clearCart: () => void;
  getTotal: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      memberId: null,
      diskon: 0,
      idempotencyKey: null,

      addItem: (item) => {
        const items = get().items;
        const existing = items.find(i => i.id === item.id);

        if (existing) {
          if (existing.qty + 1 > item.stok) {
            toast.error(`Stok tidak cukup! Tersedia: ${item.stok}`);
            return;
          }
          set({
            items: items.map(i =>
              i.id === item.id
                ? { ...i, qty: i.qty + 1, subtotal: (i.qty + 1) * i.hargaJual }
                : i
            ),
            idempotencyKey: null,
          });
          toast.success(`${item.nama} +1`);
        } else {
          if (item.stok < 1) {
            toast.error("Stok habis!");
            return;
          }
          set({
            items: [...items, { ...item, qty: 1, subtotal: item.hargaJual }],
            idempotencyKey: null,
          });
          toast.success(`${item.nama} ditambahkan`);
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter(i => i.id !== id), idempotencyKey: null });
      },

      updateQty: (id, qty) => {
        if (qty <= 0) {
          get().removeItem(id);
          return;
        }
        const item = get().items.find(i => i.id === id);
        if (item && qty > item.stok) {
          toast.error(`Stok tidak cukup! Tersedia: ${item.stok}`);
          return;
        }
        set({
          items: get().items.map(i =>
            i.id === id ? { ...i, qty, subtotal: qty * i.hargaJual } : i
          ),
          idempotencyKey: null,
        });
      },

      setMember: (memberId, diskon) => {
        const sekarang = get();
        if (sekarang.memberId === memberId && sekarang.diskon === diskon) return;
        set({ memberId, diskon, idempotencyKey: null });
      },

      resetKunci: () => set({ idempotencyKey: null }),

      ambilKunci: () => {
        const tersedia = get().idempotencyKey;
        if (tersedia) return tersedia;
        const kunci = kunciBaru();
        set({ idempotencyKey: kunci });
        return kunci;
      },

      // Kunci ikut dibuang: keranjang berikutnya adalah transaksi berikutnya.
      clearCart: () =>
        set({ items: [], memberId: null, diskon: 0, idempotencyKey: null }),

      getSubtotal: () => get().items.reduce((sum, item) => sum + item.subtotal, 0),

      getTotal: () => {
        const subtotal = get().getSubtotal();
        // Dibulatkan persis seperti di server, supaya total di layar tidak
        // berkoma ("Rp 11.727,75") dan selalu sama dengan angka di struk.
        return subtotal - Math.round((subtotal * get().diskon) / 100);
      },
    }),
    {
      name: "cart-storage",
      // Jangan persist fungsi, hanya data
      partialize: (state) => ({
        items: state.items,
        memberId: state.memberId,
        diskon: state.diskon,
        // Kunci ikut disimpan supaya percobaan ulang setelah tab ditutup
        // atau halaman dimuat ulang tetap dikenali sebagai transaksi sama.
        idempotencyKey: state.idempotencyKey,
      }),
    }
  )
);
