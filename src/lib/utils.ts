import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function generateKode(prefix: string, lastNumber: number): string {
  const nextNumber = lastNumber + 1;
  return `${prefix}${String(nextNumber).padStart(5, '0')}`;
}

export function generateBarcode(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 5).toUpperCase();
}

// ─── Public Profile Utilities ────────────────────────────────────────────────

export function generateSlug(judul: string): string {
  return judul
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .trim();
}

export function ensureUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
  if (!existingSlugs.includes(baseSlug)) return baseSlug;
  let counter = 2;
  while (existingSlugs.includes(`${baseSlug}-${counter}`)) {
    counter++;
  }
  return `${baseSlug}-${counter}`;
}

export function sortPengurus<T extends { tingkatan: string; urutan: number }>(list: T[]): T[] {
  const ORDER: Record<string, number> = { PD: 0, PC: 1, Permata: 2 };
  return [...list].sort((a, b) => {
    const tA = ORDER[a.tingkatan] ?? 99;
    const tB = ORDER[b.tingkatan] ?? 99;
    if (tA !== tB) return tA - tB;
    return a.urutan - b.urutan;
  });
}

export function filterPublishedBerita<T extends { status: string }>(list: T[]): T[] {
  return list.filter((b) => b.status === "published");
}

export function applyPublishLogic<T extends { status: string; tanggalPublikasi?: Date | null }>(
  berita: T
): T & { tanggalPublikasi: Date } {
  if (berita.status === "published" && !berita.tanggalPublikasi) {
    return { ...berita, tanggalPublikasi: new Date() };
  }
  return berita as T & { tanggalPublikasi: Date };
}
