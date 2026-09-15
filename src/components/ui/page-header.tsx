import type React from "react";

/**
 * Judul halaman — satu ukuran untuk seluruh aplikasi dan panel situs.
 * `aksi` tampil di kanan (di HP turun ke bawah judul).
 */
export function PageHeader({
  judul,
  deskripsi,
  aksi,
}: {
  judul: React.ReactNode;
  deskripsi?: React.ReactNode;
  aksi?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{judul}</h1>
        {deskripsi && <p className="text-sm text-slate-500 mt-1 max-w-3xl">{deskripsi}</p>}
      </div>
      {aksi && <div className="flex flex-wrap items-center gap-2">{aksi}</div>}
    </div>
  );
}
