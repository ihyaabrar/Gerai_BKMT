/**
 * Warna aksen yang boleh dipakai untuk ikon dan kartu. Satu tempat supaya
 * halaman tidak kembali memilih emerald/blue/orange sendiri-sendiri.
 */
export const NADA = {
  brand: "bg-brand-50 text-brand-600",
  gold: "bg-gold-50 text-gold-600",
  rose: "bg-rose-50 text-rose-600",
  sky: "bg-sky-50 text-sky-600",
  violet: "bg-violet-50 text-violet-600",
  amber: "bg-amber-50 text-amber-600",
  slate: "bg-slate-100 text-slate-600",
} as const;

export type Nada = keyof typeof NADA;
