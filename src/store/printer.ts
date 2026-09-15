import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LebarKertas } from "@/lib/escpos";

/**
 * Pengaturan printer disimpan PER PERANGKAT, bukan di database: printer
 * menempel di HP atau komputer kasir masing-masing. HP kasir pagi bisa memakai
 * printer Bluetooth 58 mm, sementara komputer di gudang mencetak ke printer
 * USB 80 mm, tanpa saling menimpa pengaturan.
 */
export type MetodeCetak = "sistem" | "bluetooth";

interface PrinterState {
  metode: MetodeCetak;
  lebar: LebarKertas;
  /** Cetak begitu transaksi di kasir selesai, tanpa menekan tombol. */
  cetakOtomatis: boolean;
  /** Printer Bluetooth terakhir yang dipilih di perangkat ini. */
  perangkatId: string | null;
  perangkatNama: string | null;
  atur: (ubah: Partial<Omit<PrinterState, "atur">>) => void;
}

export const usePrinterStore = create<PrinterState>()(
  persist(
    (set) => ({
      metode: "sistem",
      lebar: 58,
      cetakOtomatis: false,
      perangkatId: null,
      perangkatNama: null,
      atur: (ubah) => set(ubah),
    }),
    { name: "gerai-printer" }
  )
);
