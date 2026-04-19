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

interface CartStore {
  items: CartItem[];
  memberId: string | null;
  diskon: number;
  addItem: (item: Omit<CartItem, 'qty' | 'subtotal'>) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  setMember: (memberId: string | null, diskon: number) => void;
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
          });
          toast.success(`${item.nama} +1`);
        } else {
          if (item.stok < 1) {
            toast.error("Stok habis!");
            return;
          }
          set({ items: [...items, { ...item, qty: 1, subtotal: item.hargaJual }] });
          toast.success(`${item.nama} ditambahkan`);
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter(i => i.id !== id) });
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
        });
      },

      setMember: (memberId, diskon) => set({ memberId, diskon }),

      clearCart: () => set({ items: [], memberId: null, diskon: 0 }),

      getSubtotal: () => get().items.reduce((sum, item) => sum + item.subtotal, 0),

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const diskon = get().diskon;
        return subtotal - (subtotal * diskon / 100);
      },
    }),
    {
      name: "cart-storage",
      // Jangan persist fungsi, hanya data
      partialize: (state) => ({
        items: state.items,
        memberId: state.memberId,
        diskon: state.diskon,
      }),
    }
  )
);
