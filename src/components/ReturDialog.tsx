"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatRupiah } from "@/lib/utils";
import { toast } from "sonner";

interface BarisPenjualan {
  id: string;
  qty: number;
  hargaJual: number;
  sisaBisaRetur: number;
  refundPerUnit: number;
  barang: { nama: string; satuan: string };
}

interface RiwayatRetur {
  id: string;
  nomor: string;
  tanggal: string;
  alasan: string;
  totalRefund: number;
  user: { nama: string } | null;
  detail: { id: string; qty: number; kembaliKeStok: boolean; barang: { nama: string } }[];
}

interface DataRetur {
  id: string;
  nomorTransaksi: string;
  subtotal: number;
  diskon: number;
  total: number;
  metodeBayar: string;
  member: { nama: string } | null;
  detail: BarisPenjualan[];
  retur: RiwayatRetur[];
}

interface Pilihan {
  qty: string;
  rusak: boolean;
}

/**
 * Retur pembeli: pengelola memilih barang dan jumlah yang dikembalikan.
 *
 * Uang kembali per barang mengikuti diskon transaksi, dihitung ulang di server
 * — angka di dialog ini hanya perkiraan untuk dibacakan ke pembeli.
 */
export function ReturDialog({
  penjualanId,
  onTutup,
  onBerhasil,
}: {
  penjualanId: string | null;
  onTutup: () => void;
  onBerhasil: () => void;
}) {
  const [data, setData] = useState<DataRetur | null>(null);
  const [memuat, setMemuat] = useState(false);
  const [pilihan, setPilihan] = useState<Record<string, Pilihan>>({});
  const [alasan, setAlasan] = useState("");
  const [menyimpan, setMenyimpan] = useState(false);

  useEffect(() => {
    if (!penjualanId) return;
    let batal = false;
    setData(null);
    setPilihan({});
    setAlasan("");
    setMemuat(true);
    fetch(`/api/retur-penjualan?penjualanId=${encodeURIComponent(penjualanId)}`)
      .then(async (res) => {
        const json = await res.json().catch(() => null);
        if (batal) return;
        if (!res.ok) {
          toast.error(json?.error || "Gagal memuat transaksi");
          onTutup();
          return;
        }
        setData(json);
      })
      .catch(() => !batal && toast.error("Tidak dapat terhubung ke server"))
      .finally(() => !batal && setMemuat(false));
    return () => {
      batal = true;
    };
  }, [penjualanId, onTutup]);

  const barisDipilih = useMemo(
    () =>
      (data?.detail ?? [])
        .map((d) => ({ d, qty: Number(pilihan[d.id]?.qty || 0), rusak: pilihan[d.id]?.rusak ?? false }))
        .filter((b) => b.qty > 0),
    [data, pilihan]
  );

  const perkiraanRefund = barisDipilih.reduce((s, b) => s + b.d.refundPerUnit * b.qty, 0);
  const adaYangMelebihi = barisDipilih.some((b) => b.qty > b.d.sisaBisaRetur);
  const bisaSimpan =
    barisDipilih.length > 0 && !adaYangMelebihi && alasan.trim().length >= 5 && !menyimpan;

  const ubah = (id: string, perubahan: Partial<Pilihan>) =>
    setPilihan((p) => ({ ...p, [id]: { qty: p[id]?.qty ?? "", rusak: p[id]?.rusak ?? false, ...perubahan } }));

  const simpan = async () => {
    if (!data || !bisaSimpan) return;
    setMenyimpan(true);
    try {
      const res = await fetch("/api/retur-penjualan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          penjualanId: data.id,
          alasan: alasan.trim(),
          items: barisDipilih.map((b) => ({
            detailPenjualanId: b.d.id,
            qty: b.qty,
            kembaliKeStok: !b.rusak,
          })),
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(json?.error || "Gagal mencatat retur");
        return;
      }
      toast.success(json?.pesan || "Retur tercatat", { duration: 10_000 });
      onBerhasil();
      onTutup();
    } catch {
      toast.error("Tidak dapat terhubung ke server");
    } finally {
      setMenyimpan(false);
    }
  };

  return (
    <Dialog open={penjualanId !== null} onOpenChange={(buka) => !buka && !menyimpan && onTutup()}>
      <DialogContent className="sm:max-w-lg" onClose={() => !menyimpan && onTutup()}>
        <DialogHeader>
          <DialogTitle>Retur {data?.nomorTransaksi ?? ""}</DialogTitle>
        </DialogHeader>

        {memuat || !data ? (
          <p className="text-sm text-slate-500 py-6 text-center">Memuat transaksi…</p>
        ) : (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="rounded-card border border-border bg-surface-muted p-3 text-sm flex flex-wrap justify-between gap-2">
              <span className="text-slate-500">
                {data.member?.nama || "Umum"} · {data.metodeBayar}
              </span>
              <span className="font-semibold text-slate-900">Dibayar {formatRupiah(data.total)}</span>
            </div>

            <div className="space-y-2.5">
              {data.detail.map((d) => {
                const p = pilihan[d.id];
                const qty = Number(p?.qty || 0);
                const melebihi = qty > d.sisaBisaRetur;
                return (
                  <div key={d.id} className="rounded-md border border-border p-3">
                    <div className="flex justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">{d.barang.nama}</p>
                        <p className="text-xs text-slate-500">
                          Dibeli {d.qty} {d.barang.satuan} @ {formatRupiah(d.hargaJual)}
                          {d.sisaBisaRetur < d.qty && ` · sisa bisa diretur ${d.sisaBisaRetur}`}
                        </p>
                      </div>
                      <Input
                        aria-label={`Jumlah ${d.barang.nama} yang dikembalikan`}
                        type="number"
                        min={0}
                        max={d.sisaBisaRetur}
                        disabled={d.sisaBisaRetur <= 0}
                        value={p?.qty ?? ""}
                        onChange={(e) => ubah(d.id, { qty: e.target.value })}
                        placeholder="0"
                        className="w-24 shrink-0 text-right"
                      />
                    </div>
                    {melebihi && (
                      <p className="text-xs text-rose-600 mt-1.5">Maksimal {d.sisaBisaRetur}</p>
                    )}
                    {qty > 0 && !melebihi && (
                      <label className="flex items-center gap-2 mt-2 text-xs text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={p?.rusak ?? false}
                          onChange={(e) => ubah(d.id, { rusak: e.target.checked })}
                        />
                        Barang rusak — tidak dikembalikan ke stok
                      </label>
                    )}
                  </div>
                );
              })}
            </div>

            <div>
              <label htmlFor="alasan-retur" className="block text-sm font-medium text-slate-700">
                Alasan retur <span className="text-red-500">*</span>
              </label>
              <textarea
                id="alasan-retur"
                rows={2}
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                placeholder="Contoh: kemasan bocor, salah ambil ukuran"
                className="mt-1.5 flex w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm leading-relaxed focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            {barisDipilih.length > 0 && !adaYangMelebihi && (
              <div className="rounded-card border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm text-slate-600">Uang dikembalikan ke pembeli (perkiraan)</p>
                <p className="text-xl font-bold text-amber-700">{formatRupiah(perkiraanRefund)}</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {data.diskon > 0 && "Sudah dipotong diskon member transaksi ini. "}
                  {data.metodeBayar === "Tunai"
                    ? "Diambil dari laci kasir yang sedang buka."
                    : `Dikembalikan lewat ${data.metodeBayar}, tidak dari laci.`}{" "}
                  Laba bulan ini berkurang sesuai retur ini.
                </p>
              </div>
            )}

            {data.retur.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1.5">Retur sebelumnya</p>
                <ul className="space-y-1.5">
                  {data.retur.map((r) => (
                    <li key={r.id} className="text-xs text-slate-600 rounded-md bg-surface-muted px-3 py-2">
                      <span className="font-medium">{r.nomor}</span> · {formatRupiah(r.totalRefund)}
                      {r.user?.nama && ` · ${r.user.nama}`}
                      <br />
                      {r.detail
                        .map((x) => `${x.qty} ${x.barang.nama}${x.kembaliKeStok ? "" : " (rusak)"}`)
                        .join(", ")}{" "}
                      — {r.alasan}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <Button variant="outline" disabled={menyimpan} onClick={onTutup}>
                Tutup
              </Button>
              <Button disabled={!bisaSimpan} onClick={simpan}>
                {menyimpan ? "Menyimpan..." : "Catat Retur"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
