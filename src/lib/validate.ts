/**
 * Helper validasi ringan untuk body request API.
 * Menggantikan pola lama `prisma.create({ data: body })` yang membuat
 * client bisa mengisi kolom apa pun (mass assignment).
 */

export class ValidationError extends Error {}

export function requireString(
  value: unknown,
  field: string,
  { max = 255, min = 1 }: { max?: number; min?: number } = {}
): string {
  if (typeof value !== "string") {
    throw new ValidationError(`${field} wajib diisi`);
  }
  const trimmed = value.trim();
  if (trimmed.length < min) {
    // Bedakan "belum diisi" dari "terlalu pendek" supaya pesannya berguna.
    throw new ValidationError(
      min > 1
        ? `${field} minimal ${min} karakter`
        : `${field} wajib diisi`
    );
  }
  if (trimmed.length > max) {
    throw new ValidationError(`${field} maksimal ${max} karakter`);
  }
  return trimmed;
}

export function optionalString(
  value: unknown,
  field: string,
  { max = 255 }: { max?: number } = {}
): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") {
    throw new ValidationError(`${field} tidak valid`);
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > max) {
    throw new ValidationError(`${field} maksimal ${max} karakter`);
  }
  return trimmed;
}

export function requireNumber(
  value: unknown,
  field: string,
  { min = 0, max = Number.MAX_SAFE_INTEGER }: { min?: number; max?: number } = {}
): number {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) {
    throw new ValidationError(`${field} harus berupa angka`);
  }
  if (num < min) {
    throw new ValidationError(`${field} minimal ${min}`);
  }
  if (num > max) {
    throw new ValidationError(`${field} melebihi batas maksimal`);
  }
  return num;
}

export function requireInt(
  value: unknown,
  field: string,
  options: { min?: number; max?: number } = {}
): number {
  const num = requireNumber(value, field, options);
  if (!Number.isInteger(num)) {
    throw new ValidationError(`${field} harus bilangan bulat`);
  }
  return num;
}

export function optionalBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

export function requireOneOf<T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[]
): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new ValidationError(`${field} harus salah satu dari: ${allowed.join(", ")}`);
  }
  return value as T;
}

/** Konteks tambahan untuk log; semuanya opsional. */
export interface KonteksKesalahan {
  endpoint?: string;
  userId?: string;
}

/**
 * Bungkus handler API supaya ValidationError otomatis jadi HTTP 400.
 *
 * Untuk kesalahan yang tidak terduga, dibuatkan kode pendek yang ikut
 * ditampilkan ke pengguna DAN tercetak di log. Organisasi ini tidak punya
 * staf IT: ketika kasir menelepon pengurus dan berkata "errornya BX7K2P",
 * kode itulah satu-satunya cara menemukan baris log yang tepat. Sebelumnya
 * pesan yang muncul selalu generik dan tidak bisa dihubungkan ke apa pun.
 */
export function toErrorResponse(
  error: unknown,
  fallbackMessage: string,
  konteks?: KonteksKesalahan
) {
  if (error instanceof ValidationError) {
    return { message: error.message, status: 400 as const };
  }

  // Body yang bukan JSON adalah kesalahan pengirim, bukan kesalahan server.
  // Sebelumnya ini dilaporkan sebagai 500, yang menyesatkan saat menelusuri
  // masalah: log penuh "error server" padahal requestnya memang cacat.
  if (error instanceof SyntaxError) {
    return { message: "Format data tidak valid", status: 400 as const };
  }

  const kode = Array.from({ length: 6 }, () =>
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".charAt(Math.floor(Math.random() * 32))
  ).join("");

  // Satu baris JSON per kesalahan: bisa dicari, bisa disaring, dan tetap
  // terbaca kalau nanti dikirim ke layanan pemantauan.
  console.error(
    JSON.stringify({
      kode,
      waktu: new Date().toISOString(),
      pesan: fallbackMessage,
      endpoint: konteks?.endpoint,
      userId: konteks?.userId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
  );

  return {
    message: `${fallbackMessage}. Kode kesalahan: ${kode}`,
    status: 500 as const,
    kode,
  };
}

/** Parse parameter paginasi dari query string. */
export function parsePagination(searchParams: URLSearchParams, defaultLimit = 50) {
  const rawPage = Number(searchParams.get("page"));
  const rawLimit = Number(searchParams.get("limit"));

  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(Math.floor(rawLimit), 200) : defaultLimit;

  return { page, limit, skip: (page - 1) * limit };
}
