"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardIcon, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StrukPratinjau } from "@/components/PrintReceipt";
import { Button } from "@/components/ui/button";
import { Bluetooth, BluetoothOff, Info, Printer, ScrollText } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { usePrinterStore, type MetodeCetak } from "@/store/printer";
import {
  bluetoothDidukung,
  pilihPrinter,
  printerTersambung,
  putuskanPrinter,
  sambungUlang,
} from "@/lib/printer-bluetooth";
import { TOKO_BAWAAN, ambilIdentitasToko, cetakStruk } from "@/lib/cetak";
import type { DataStruk } from "@/lib/struk";
import { susunStruk, type IdentitasStruk, type LebarKertas } from "@/lib/escpos";

const STRUK_UJI = (): DataStruk => ({
  nomorTransaksi: "CETAK-UJI",
  tanggal: new Date(),
  items: [
    { nama: "Contoh Barang Satu", qty: 2, harga: 12_500, subtotal: 25_000 },
    { nama: "Contoh barang dengan nama yang cukup panjang", qty: 1, harga: 7_000, subtotal: 7_000 },
  ],
  subtotal: 32_000,
  diskon: 0,
  total: 32_000,
  bayar: 50_000,
  kembalian: 18_000,
  kasir: "Cetak uji",
});

const PILIHAN_METODE: { id: MetodeCetak; judul: string; ket: string; icon: typeof Printer }[] = [
  {
    id: "sistem",
    judul: "Printer sistem",
    ket: "Printer USB, WiFi, atau Bluetooth yang sudah terpasang di HP/komputer. Struk dicetak lewat dialog cetak.",
    icon: Printer,
  },
  {
    id: "bluetooth",
    judul: "Printer thermal Bluetooth",
    ket: "Kirim langsung ke printer thermal Bluetooth tanpa dialog cetak. Chrome di Android atau komputer.",
    icon: Bluetooth,
  },
];

export default function PrinterPage() {
  const { metode, lebar, cetakOtomatis, perangkatId, perangkatNama, atur } = usePrinterStore();
  const [didukung, setDidukung] = useState<boolean | null>(null);
  const [tersambung, setTersambung] = useState(false);
  const [sibuk, setSibuk] = useState(false);
  const [toko, setToko] = useState<IdentitasStruk>(TOKO_BAWAAN);

  // Dicek di browser saja; saat render server `navigator` belum ada.
  useEffect(() => {
    setDidukung(bluetoothDidukung());
    setTersambung(printerTersambung());
    ambilIdentitasToko().then(setToko);
  }, []);

  const pilih = async () => {
    setSibuk(true);
    try {
      const p = await pilihPrinter();
      atur({ perangkatId: p.id, perangkatNama: p.nama, metode: "bluetooth" });
      setTersambung(true);
      toast.success(`Tersambung ke ${p.nama}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyambungkan printer");
    } finally {
      setSibuk(false);
    }
  };

  const sambung = async () => {
    setSibuk(true);
    const ok = await sambungUlang(perangkatId);
    setTersambung(ok);
    setSibuk(false);
    if (ok) toast.success(`Tersambung ke ${perangkatNama ?? "printer"}`);
    else toast.error("Printer tidak ditemukan. Nyalakan printer, lalu pilih ulang.");
  };

  const putuskan = () => {
    putuskanPrinter();
    atur({ perangkatId: null, perangkatNama: null });
    setTersambung(false);
  };

  const cetakUji = async () => {
    setSibuk(true);
    try {
      const toko = await ambilIdentitasToko();
      const { printerBaru } = await cetakStruk(
        STRUK_UJI(),
        toko,
        { metode, lebar, perangkatId },
        { bolehPilihPrinter: true }
      );
      if (printerBaru) atur({ perangkatId: printerBaru.id, perangkatNama: printerBaru.nama });
      if (metode === "bluetooth") {
        setTersambung(true);
        toast.success("Struk uji dikirim ke printer");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal mencetak");
    } finally {
      setSibuk(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        judul="Printer"
        deskripsi="Pengaturan ini tersimpan di perangkat ini saja — setiap HP atau komputer kasir diatur sendiri."
      />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_24rem] gap-6 items-start">
      <div className="space-y-6 min-w-0">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2.5">
            <CardIcon icon={Printer} nada="brand" />
            Cara mencetak struk
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {PILIHAN_METODE.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={metode === m.id}
              onClick={() => atur({ metode: m.id })}
              className={cn(
                "text-left rounded-xl border p-4 transition-colors",
                metode === m.id
                  ? "border-brand-500 bg-brand-50 ring-2 ring-brand-500/20"
                  : "border-border hover:border-brand-300"
              )}
            >
              <m.icon className={cn("h-5 w-5", metode === m.id ? "text-brand-600" : "text-slate-400")} />
              <p className="font-semibold text-slate-900 mt-2">{m.judul}</p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{m.ket}</p>
            </button>
          ))}
        </CardContent>
      </Card>

      {metode === "bluetooth" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2.5">
              <CardIcon icon={Bluetooth} nada="sky" />
              Printer Bluetooth
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {didukung === false ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex gap-3">
                <BluetoothOff className="h-5 w-5 text-amber-600 shrink-0" />
                <p className="text-sm text-amber-900 leading-relaxed">
                  Browser ini tidak mendukung Bluetooth langsung. Buka aplikasi ini di <strong>Google Chrome</strong>{" "}
                  pada Android, Windows, atau Mac. iPhone dan iPad belum didukung — di sana pilih{" "}
                  <strong>Printer sistem</strong>.
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface-sunken/60 p-3.5">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {perangkatNama ?? "Belum ada printer dipilih"}
                    </p>
                    <p className={cn("text-xs mt-0.5", tersambung ? "text-brand-600 font-medium" : "text-slate-500")}>
                      {tersambung
                        ? "Tersambung"
                        : perangkatNama
                          ? "Belum tersambung di tab ini — tersambung otomatis saat mencetak"
                          : "Pilih printer untuk mulai"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {perangkatNama && !tersambung && (
                      <Button variant="outline" size="sm" disabled={sibuk} onClick={sambung}>
                        Sambungkan
                      </Button>
                    )}
                    <Button size="sm" disabled={sibuk} onClick={pilih}>
                      {perangkatNama ? "Ganti printer" : "Pilih printer"}
                    </Button>
                    {perangkatNama && (
                      <Button variant="ghost" size="sm" disabled={sibuk} onClick={putuskan}>
                        Lupakan
                      </Button>
                    )}
                  </div>
                </div>
                <ul className="text-xs text-slate-500 space-y-1 list-disc pl-4 leading-relaxed">
                  <li>Nyalakan printer dan Bluetooth HP. Di Android, izinkan juga akses Lokasi/Perangkat sekitar bila diminta.</li>
                  <li>Tidak perlu pairing lewat pengaturan HP — pilih langsung dari daftar yang muncul.</li>
                  <li>Printer yang tidak muncul kemungkinan hanya mendukung Bluetooth lama; gunakan Printer sistem.</li>
                </ul>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2.5">
            <CardIcon icon={ScrollText} nada="gold" />
            Kertas & kebiasaan cetak
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Lebar kertas</p>
            <div className="flex gap-2">
              {([58, 80] as LebarKertas[]).map((l) => (
                <Button
                  key={l}
                  type="button"
                  variant={lebar === l ? "default" : "outline"}
                  aria-pressed={lebar === l}
                  onClick={() => atur({ lebar: l })}
                >
                  {l} mm
                </Button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              Printer thermal kecil (genggam) umumnya 58 mm; printer meja kasir umumnya 80 mm.
            </p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-brand-600"
              checked={cetakOtomatis}
              onChange={(e) => atur({ cetakOtomatis: e.target.checked })}
            />
            <span>
              <span className="text-sm font-medium text-slate-900">Cetak otomatis setelah transaksi</span>
              <span className="block text-xs text-slate-500 mt-0.5 leading-relaxed">
                Struk langsung dicetak begitu pembayaran berhasil.
                {metode === "bluetooth" &&
                  " Printer Bluetooth harus sudah tersambung — tekan Cetak Struk sekali setelah membuka aplikasi."}
              </span>
            </span>
          </label>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button onClick={cetakUji} disabled={sibuk}>
              <Printer className="h-4 w-4" />
              Cetak uji
            </Button>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Info className="h-3.5 w-3.5" />
              Mencetak struk contoh dengan pengaturan di atas.
            </p>
          </div>
        </CardContent>
      </Card>
      </div>

      <Card className="xl:sticky xl:top-6">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2.5">
            <CardIcon icon={ScrollText} nada="slate" />
            Contoh struk
          </CardTitle>
          <p className="text-sm text-slate-500">Seperti ini struk keluar di kertas {lebar} mm.</p>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl bg-surface-sunken p-4">
            <StrukPratinjau baris={susunStruk(STRUK_UJI(), toko, lebar)} lebar={lebar} />
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
