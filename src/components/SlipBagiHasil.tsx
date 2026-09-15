"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle, Printer } from "lucide-react";
import { toast } from "sonner";
import { cetakLewatSistem } from "@/lib/cetak";
import {
  nomorWhatsApp,
  pesanWhatsApp,
  slipHtml,
  type DataSlip,
  type OrganisasiSlip,
} from "@/lib/slip";

interface DataSlipPeriode {
  organisasi: OrganisasiSlip;
  slips: DataSlip[];
}

/** Ambil data slip satu periode yang sudah ditutup. */
export function useSlipPeriode(periode: string | null, aktif: boolean) {
  const [data, setData] = useState<DataSlipPeriode | null>(null);

  useEffect(() => {
    if (!periode || !aktif) {
      setData(null);
      return;
    }
    let batal = false;
    fetch(`/api/distribusi/slip?periode=${encodeURIComponent(periode)}`)
      .then(async (res) => {
        const json = await res.json().catch(() => null);
        if (batal) return;
        if (!res.ok) {
          toast.error(json?.error || "Gagal memuat slip");
          return;
        }
        setData(json);
      })
      .catch(() => !batal && toast.error("Tidak dapat terhubung ke server"));
    return () => {
      batal = true;
    };
  }, [periode, aktif]);

  return data;
}

/** Cetak seluruh slip periode: satu halaman A5 per nasabah. */
export async function cetakSemuaSlip(data: DataSlipPeriode) {
  if (data.slips.length === 0) {
    toast.error("Tidak ada nasabah pada periode ini");
    return;
  }
  await cetakLewatSistem(slipHtml(data.slips, data.organisasi));
}

/**
 * Pratinjau slip satu nasabah, dengan tombol cetak dan kirim WhatsApp.
 *
 * Pratinjau memakai HTML yang sama dengan yang dicetak (iframe), jadi yang
 * terlihat = yang tercetak. "Simpan PDF" tersedia dari dialog cetak browser.
 */
export function DialogSlip({
  data,
  nasabahId,
  onTutup,
}: {
  data: DataSlipPeriode | null;
  nasabahId: string | null;
  onTutup: () => void;
}) {
  const slip = useMemo(
    () => data?.slips.find((s) => s.nasabah.nasabahId === nasabahId) ?? null,
    [data, nasabahId]
  );
  const html = useMemo(() => (slip && data ? slipHtml([slip], data.organisasi) : ""), [slip, data]);
  const nomor = nomorWhatsApp(slip?.nasabah.telepon);
  const tautanWa =
    slip && data && nomor
      ? `https://wa.me/${nomor}?text=${encodeURIComponent(pesanWhatsApp(slip, data.organisasi))}`
      : null;

  return (
    <Dialog open={nasabahId !== null} onOpenChange={(buka) => !buka && onTutup()}>
      <DialogContent className="sm:max-w-xl" onClose={onTutup}>
        <DialogHeader>
          <DialogTitle>Slip {slip?.nasabah.nama ?? ""}</DialogTitle>
        </DialogHeader>

        {!slip ? (
          <p className="text-sm text-slate-500 py-8 text-center">Memuat slip…</p>
        ) : (
          <div className="space-y-3">
            <iframe
              title={`Pratinjau slip ${slip.nasabah.nama}`}
              srcDoc={html}
              sandbox=""
              className="w-full h-[55vh] rounded-md border border-border bg-white"
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <Button className="flex-1" onClick={() => cetakLewatSistem(html)}>
                <Printer className="h-4 w-4 mr-2" />
                Cetak / Simpan PDF
              </Button>
              {tautanWa ? (
                <a
                  href={tautanWa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Kirim lewat WhatsApp
                </a>
              ) : (
                <p className="flex-1 text-xs text-slate-500 self-center">
                  Nomor telepon nasabah belum diisi atau tidak valid — isi di Master Data → Nasabah untuk
                  mengirim lewat WhatsApp.
                </p>
              )}
            </div>
            {tautanWa && (
              <p className="text-[11px] text-slate-400">
                WhatsApp akan terbuka dengan pesan ringkasan yang sudah terisi. Periksa lalu tekan kirim sendiri.
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
