"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Button } from "./ui/button";
import { Camera, Loader2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { toast } from "sonner";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  /** Teks tombol; kosongkan untuk tombol ikon saja. */
  label?: string;
  className?: string;
}

/** Jenis barcode pada kemasan barang di Indonesia, plus QR. */
const FORMAT = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.QR_CODE,
];

/**
 * Pemindai barcode lewat kamera HP/laptop.
 *
 * Pemindai USB/Bluetooth (yang bekerja seperti keyboard) tidak memakai
 * komponen ini: cukup arahkan kursor ke kotak cari, lalu pindai.
 *
 * Perbaikan dari versi sebelumnya: status "sedang memindai" dibaca dari
 * variabel React yang sudah basi di dalam callback, sehingga kamera tidak
 * pernah dimatikan setelah barcode terbaca dan pemindaian berikutnya gagal
 * membuka kamera. Kotak pindai juga persegi, padahal barcode kemasan lebar.
 */
export function BarcodeScanner({ onScan, label = "Scan Barcode", className }: BarcodeScannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [memuat, setMemuat] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const berjalan = useRef(false);
  const sudahTerbaca = useRef(false);
  const idElemen = `pindai-${useId().replace(/:/g, "")}`;

  const hentikan = async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (scanner && berjalan.current) {
      berjalan.current = false;
      try {
        await scanner.stop();
      } catch {
        // Kamera sudah berhenti.
      }
      try {
        scanner.clear();
      } catch {
        // Elemen sudah dilepas.
      }
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    let batal = false;
    sudahTerbaca.current = false;

    const mulai = async () => {
      setMemuat(true);
      try {
        const scanner = new Html5Qrcode(idElemen, {
          formatsToSupport: FORMAT,
          useBarCodeDetectorIfSupported: true,
          verbose: false,
        });
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 12,
            qrbox: (lebar: number) => ({
              width: Math.min(Math.floor(lebar * 0.9), 340),
              height: Math.min(Math.floor(lebar * 0.45), 170),
            }),
          },
          (hasil) => {
            // Callback bisa terpanggil beberapa kali sebelum kamera berhenti.
            if (sudahTerbaca.current) return;
            sudahTerbaca.current = true;
            navigator.vibrate?.(60);
            onScan(hasil.trim());
            hentikan().finally(() => setIsOpen(false));
          },
          () => {
            // Belum ada barcode di bingkai — normal.
          }
        );
        berjalan.current = true;
        if (batal) await hentikan();
      } catch (e) {
        scannerRef.current = null;
        const pesan = String(e);
        toast.error("Kamera tidak bisa dibuka", {
          description: /Permission|NotAllowed/i.test(pesan)
            ? "Izinkan akses kamera untuk situs ini di pengaturan browser, lalu coba lagi."
            : "Pastikan kamera tidak sedang dipakai aplikasi lain. Di laptop tanpa kamera, pakai pemindai USB atau ketik barcode.",
        });
        setIsOpen(false);
      } finally {
        setMemuat(false);
      }
    };
    mulai();

    return () => {
      batal = true;
      hentikan();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(true)}
        className={className}
        aria-label={label ? undefined : "Scan barcode dengan kamera"}
        title="Scan barcode dengan kamera"
      >
        <Camera className="h-4 w-4" />
        {label}
      </Button>

      <Dialog open={isOpen} onOpenChange={(v) => !v && setIsOpen(false)}>
        <DialogContent className="max-w-md" onClose={() => setIsOpen(false)}>
          <DialogHeader>
            <DialogTitle>Scan Barcode</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative w-full min-h-[220px] rounded-lg overflow-hidden border border-border bg-slate-900">
              <div id={idElemen} className="w-full" />
              {memuat && (
                <div className="absolute inset-0 flex items-center justify-center text-white text-sm gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Membuka kamera...
                </div>
              )}
            </div>

            <p className="text-center text-sm text-slate-500">
              Arahkan barcode ke dalam kotak. Jaga jarak ±15 cm dan pastikan cukup terang.
            </p>

            <Button onClick={() => setIsOpen(false)} variant="outline" className="w-full">
              <X className="h-4 w-4" />
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
