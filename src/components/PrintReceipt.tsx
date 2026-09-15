"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Printer } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { format } from "date-fns";

interface ReceiptItem {
  nama: string;
  qty: number;
  harga: number;
  subtotal: number;
}

interface ReceiptData {
  nomorTransaksi: string;
  tanggal: Date;
  items: ReceiptItem[];
  subtotal: number;
  /** Nilai diskon dalam rupiah (bukan persen). */
  diskon: number;
  total: number;
  bayar: number;
  kembalian: number;
  member?: string;
  kasir: string;
  /** Cetak ulang dari riwayat penjualan. */
  salinan?: boolean;
}

interface IdentitasToko {
  nama: string;
  alamat: string;
  telepon: string;
}

/**
 * Isian contoh dari seed lama. Database produksi yang di-seed sebelum
 * perbaikan ini masih menyimpannya; struk tidak boleh mencetak alamat dan
 * nomor telepon rekaan kepada pembeli.
 */
const ISIAN_CONTOH = new Set(["Jl. Contoh No. 123", "081234567890"]);

const bersihkan = (nilai: unknown): string => {
  const teks = typeof nilai === "string" ? nilai.trim() : "";
  return ISIAN_CONTOH.has(teks) ? "" : teks;
};

export function PrintReceipt({ data }: { data: ReceiptData }) {
  const printRef = useRef<HTMLDivElement>(null);

  // Kepala struk diambil dari Sistem → Pengaturan. Sebelumnya alamat, telepon,
  // dan situs web ditulis mati di sini — dan situs itu bukan milik gerai.
  const [toko, setToko] = useState<IdentitasToko>({ nama: "Gerai BKMT", alamat: "", telepon: "" });
  useEffect(() => {
    let batal = false;
    fetch("/api/pengaturan")
      .then((res) => (res.ok ? res.json() : null))
      .then((p) => {
        if (batal || !p) return;
        setToko({
          nama: bersihkan(p.namaToko) || "Gerai BKMT",
          alamat: bersihkan(p.alamatToko),
          telepon: bersihkan(p.teleponToko),
        });
      })
      .catch(() => {
        // Struk tetap bisa dicetak dengan nama bawaan.
      });
    return () => {
      batal = true;
    };
  }, []);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Struk - ${data.nomorTransaksi}</title>
          <style>
            @media print {
              @page { margin: 0; }
              body { margin: 1cm; }
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.4;
              max-width: 300px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              border-bottom: 1px dashed #000;
              padding-bottom: 10px;
              margin-bottom: 10px;
            }
            .header h1 {
              margin: 0;
              font-size: 18px;
              font-weight: bold;
            }
            .header p {
              margin: 2px 0;
              font-size: 11px;
            }
            .info {
              margin-bottom: 10px;
              font-size: 11px;
            }
            .items {
              border-top: 1px dashed #000;
              border-bottom: 1px dashed #000;
              padding: 10px 0;
              margin: 10px 0;
            }
            .item {
              margin-bottom: 5px;
            }
            .item-name {
              font-weight: bold;
            }
            .item-detail {
              display: flex;
              justify-content: space-between;
              font-size: 11px;
            }
            .totals {
              margin-top: 10px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin: 3px 0;
            }
            .total-row.grand {
              font-weight: bold;
              font-size: 14px;
              border-top: 1px solid #000;
              padding-top: 5px;
              margin-top: 5px;
            }
            .footer {
              text-align: center;
              margin-top: 15px;
              padding-top: 10px;
              border-top: 1px dashed #000;
              font-size: 11px;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <div>
      <Button onClick={handlePrint} className="mb-4 bg-blue-600 hover:bg-blue-700">
        <Printer className="h-4 w-4 mr-2" />
        Print Struk
      </Button>

      <div ref={printRef} className="bg-white p-6 border rounded-lg max-w-sm mx-auto font-mono text-sm">
        <div className="header text-center border-b border-dashed border-gray-400 pb-3 mb-3">
          <h1 className="text-lg font-bold">{toko.nama.toUpperCase()}</h1>
          {toko.alamat && <p className="text-xs">{toko.alamat}</p>}
          {toko.telepon && <p className="text-xs">Telp: {toko.telepon}</p>}
        </div>

        <div className="info text-xs mb-3">
          {data.salinan && (
            <p className="text-center font-bold tracking-widest mb-2">*** SALINAN ***</p>
          )}
          <div className="flex justify-between">
            <span>No. Transaksi:</span>
            <span className="font-bold">{data.nomorTransaksi}</span>
          </div>
          <div className="flex justify-between">
            <span>Tanggal:</span>
            <span>{format(new Date(data.tanggal), "dd/MM/yyyy HH:mm")}</span>
          </div>
          <div className="flex justify-between">
            <span>Kasir:</span>
            <span>{data.kasir}</span>
          </div>
          {data.member && (
            <div className="flex justify-between">
              <span>Member:</span>
              <span>{data.member}</span>
            </div>
          )}
        </div>

        <div className="items border-t border-b border-dashed border-gray-400 py-3 my-3">
          {data.items.map((item, index) => (
            <div key={index} className="mb-3">
              <div className="font-bold">{item.nama}</div>
              <div className="flex justify-between text-xs">
                <span>
                  {item.qty} x {formatRupiah(item.harga)}
                </span>
                <span className="font-semibold">{formatRupiah(item.subtotal)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="totals">
          <div className="flex justify-between text-xs mb-1">
            <span>Subtotal:</span>
            <span>{formatRupiah(data.subtotal)}</span>
          </div>
          {data.diskon > 0 && (
            <div className="flex justify-between text-xs mb-1">
              <span>
                Diskon
                {data.subtotal > 0
                  ? ` (${Math.round((data.diskon / data.subtotal) * 100)}%)`
                  : ""}
                :
              </span>
              <span>-{formatRupiah(data.diskon)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base border-t border-gray-400 pt-2 mt-2">
            <span>TOTAL:</span>
            <span>{formatRupiah(data.total)}</span>
          </div>
          <div className="flex justify-between text-xs mt-2">
            <span>Bayar:</span>
            <span>{formatRupiah(data.bayar)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Kembalian:</span>
            <span>{formatRupiah(data.kembalian)}</span>
          </div>
        </div>

        <div className="footer text-center mt-4 pt-3 border-t border-dashed border-gray-400 text-xs">
          <p>Terima Kasih</p>
          <p>Selamat Berbelanja Kembali</p>
        </div>
      </div>
    </div>
  );
}
