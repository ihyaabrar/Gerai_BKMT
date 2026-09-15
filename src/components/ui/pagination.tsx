import { Button } from "./button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  totalItems: number;
}

/**
 * Deret nomor halaman. `sisi` = berapa halaman di kiri-kanan halaman aktif.
 * Di HP dipakai 0 (hanya halaman aktif + awal/akhir) supaya deretnya muat
 * di lebar 360 px; sebelumnya 1 2 3 4 … 28 membuat seluruh halaman bisa
 * digeser ke samping.
 */
export function nomorHalaman(aktif: number, total: number, sisi: number): (number | "...")[] {
  const hasil: (number | "...")[] = [];
  const awal = Math.max(2, aktif - sisi);
  const akhir = Math.min(total - 1, aktif + sisi);
  hasil.push(1);
  if (awal > 2) hasil.push("...");
  for (let i = awal; i <= akhir; i++) hasil.push(i);
  if (akhir < total - 1) hasil.push("...");
  if (total > 1) hasil.push(total);
  return hasil;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const tombolHalaman = (daftar: (number | "...")[]) =>
    daftar.map((page, idx) =>
      page === "..." ? (
        <span key={`elipsis-${idx}`} className="px-1 text-slate-400" aria-hidden="true">
          …
        </span>
      ) : (
        <Button
          key={page}
          variant={currentPage === page ? "default" : "outline"}
          size="sm"
          aria-current={currentPage === page ? "page" : undefined}
          onClick={() => onPageChange(page)}
          className="min-w-9 px-2.5"
        >
          {page}
        </Button>
      )
    );

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1 sm:px-4 pt-4 pb-1 border-t">
      <p className="text-xs sm:text-sm text-slate-600 text-center sm:text-left">
        Menampilkan <span className="font-medium">{startItem}</span>–
        <span className="font-medium">{endItem}</span> dari{" "}
        <span className="font-medium">{totalItems}</span> data
      </p>

      <nav aria-label="Halaman" className="flex items-center justify-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          aria-label="Halaman sebelumnya"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-2.5"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <span className="flex items-center gap-1.5 sm:hidden">
          {tombolHalaman(nomorHalaman(currentPage, totalPages, 0))}
        </span>
        <span className="hidden sm:flex items-center gap-1.5">
          {tombolHalaman(nomorHalaman(currentPage, totalPages, 1))}
        </span>

        <Button
          variant="outline"
          size="sm"
          aria-label="Halaman berikutnya"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-2.5"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </nav>
    </div>
  );
}
