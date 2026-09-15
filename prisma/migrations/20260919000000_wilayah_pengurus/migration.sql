-- Cabang/wilayah pengurus, supaya Pimpinan Cabang bisa ditampilkan per cabang.

-- AlterTable
ALTER TABLE "Pengurus" ADD COLUMN     "wilayah" TEXT;

-- Data yang sudah ada: nama kecamatan selama ini hanya tertulis di jabatan,
-- mis. "Ketua PC. BKMT Kecamatan Sungai Raya" -> "Sungai Raya".
UPDATE "Pengurus"
SET "wilayah" = btrim(substring("jabatan" from '(?i)kecamatan[[:space:]]+(.+)$'))
WHERE "wilayah" IS NULL
  AND "tingkatan" IN ('PC', 'Permata')
  AND "jabatan" ~* 'kecamatan[[:space:]]+[^[:space:]]';
