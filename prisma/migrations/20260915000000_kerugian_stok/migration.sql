-- Barang rusak/hilang (penyesuaian stok) kini mengurangi laba yang dibagi.
--
-- Setiap penyesuaian menyimpan harga beli saat dicatat, dan rekaman distribusi
-- menyimpan nilai kerugian stok periodenya. Rekaman distribusi yang sudah ada
-- mendapat 0, sehingga angka periode yang sudah ditutup tidak berubah.

-- AlterTable
ALTER TABLE "DistribusiLaba" ADD COLUMN     "kerugianStok" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "PenyesuaianStok" ADD COLUMN     "hargaBeli" DOUBLE PRECISION;

-- Penyesuaian lama belum mencatat harga beli. Harga beli barang saat ini
-- adalah perkiraan terbaik yang tersedia; tanpa ini, barang rusak yang dicatat
-- sebelum migrasi bernilai nol di periode yang belum ditutup.
UPDATE "PenyesuaianStok" AS p
SET "hargaBeli" = b."hargaBeli"
FROM "Barang" AS b
WHERE p."barangId" = b."id" AND p."hargaBeli" IS NULL;
