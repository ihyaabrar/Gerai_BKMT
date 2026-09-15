"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "./ui/button";
import { Bluetooth, Printer, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { susunStruk, type BarisStruk, type IdentitasStruk, type LebarKertas } from "@/lib/escpos";
import { TOKO_BAWAAN, ambilIdentitasToko, cetakStruk } from "@/lib/cetak";
import type { DataStruk } from "@/lib/struk";
import { usePrinterStore } from "@/store/printer";
import { cn } from "@/lib/utils";
import { gambarLebar } from "@/lib/gambar";

/**
 * Pratinjau dan tombol cetak struk.
 *
 * Pratinjau memakai susunan baris yang sama dengan yang dikirim ke printer,
 * jadi yang terlihat di layar = yang keluar di kertas (58 atau 80 mm).
 * Cara mencetak diatur per perangkat di Sistem → Printer.
 */
export function PrintReceipt({ data, otomatis = false }: { data: DataStruk; otomatis?: boolean }) {
  const { metode, lebar, cetakOtomatis, perangkatId, perangkatNama, atur } = usePrinterStore();
  const [toko, setToko] = useState<IdentitasStruk>(TOKO_BAWAAN);
  const [tokoSiap, setTokoSiap] = useState(false);
  const [mencetak, setMencetak] = useState(false);
  const sudahOtomatis = useRef(false);

  useEffect(() => {
    let batal = false;
    ambilIdentitasToko().then((t) => {
      if (batal) return;
      setToko(t);
      setTokoSiap(true);
    });
    return () => {
      batal = true;
    };
  }, []);

  const cetak = async (dariKlik: boolean) => {
    if (mencetak) return;
    setMencetak(true);
    try {
      const { printerBaru } = await cetakStruk(
        data,
        toko,
        { metode, lebar, perangkatId },
        { bolehPilihPrinter: dariKlik }
      );
      if (printerBaru) atur({ perangkatId: printerBaru.id, perangkatNama: printerBaru.nama });
      if (metode === "bluetooth") toast.success("Struk dikirim ke printer");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal mencetak struk");
    } finally {
      setMencetak(false);
    }
  };

  // Cetak otomatis sekali, setelah kepala struk dari Pengaturan termuat.
  useEffect(() => {
    if (!otomatis || !cetakOtomatis || !tokoSiap || sudahOtomatis.current || data.salinan) return;
    sudahOtomatis.current = true;
    cetak(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otomatis, cetakOtomatis, tokoSiap]);

  const baris = susunStruk(data, toko, lebar);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Button onClick={() => cetak(true)} disabled={mencetak}>
          {metode === "bluetooth" ? <Bluetooth className="h-4 w-4 mr-2" /> : <Printer className="h-4 w-4 mr-2" />}
          {mencetak ? "Mencetak..." : "Cetak Struk"}
        </Button>
        <Link
          href="/app/sistem/printer"
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-brand-700"
        >
          <Settings2 className="h-3.5 w-3.5" />
          {metode === "bluetooth" ? perangkatNama || "Bluetooth" : "Printer sistem"} · {lebar} mm
        </Link>
      </div>

      <StrukPratinjau baris={baris} lebar={lebar} logoUrl={toko.logoUrl} />
    </div>
  );
}

/** Tampilan struk di layar: baris yang sama persis dengan yang dikirim ke printer. */
export function StrukPratinjau({
  baris,
  lebar,
  logoUrl,
}: {
  baris: BarisStruk[];
  lebar: LebarKertas;
  logoUrl?: string | null;
}) {
  return (
    <div
      className={cn(
        "bg-white border border-border rounded-lg mx-auto px-3 py-4 font-mono text-slate-900 overflow-x-auto shadow-sm",
        lebar === 58 ? "max-w-[18rem] text-[11px]" : "max-w-[26rem] text-[10.5px]"
      )}
    >
      {logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={gambarLebar(logoUrl, 320)}
          alt=""
          className={cn(
            "mx-auto mb-2 object-contain grayscale contrast-125",
            lebar === 58 ? "max-h-24 max-w-[7.5rem]" : "max-h-28 max-w-[9rem]"
          )}
        />
      )}
      {baris.map((b, i) => (
        <div
          key={i}
          className={cn(
            "whitespace-pre leading-snug",
            b.rata === "tengah" && "text-center",
            b.tebal && "font-bold",
            b.besar && "text-base"
          )}
        >
          {b.teks || " "}
        </div>
      ))}
    </div>
  );
}
