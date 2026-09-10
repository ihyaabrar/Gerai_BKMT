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
    throw new ValidationError(`${field} wajib diisi`);
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

/** Bungkus handler API supaya ValidationError otomatis jadi HTTP 400. */
export function toErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof ValidationError) {
    return { message: error.message, status: 400 as const };
  }
  console.error(fallbackMessage, error);
  return { message: fallbackMessage, status: 500 as const };
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
