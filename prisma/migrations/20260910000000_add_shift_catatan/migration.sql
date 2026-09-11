-- Kolom catatan sudah dikumpulkan di form tutup shift tapi belum pernah
-- ada di skema, sehingga isian kasir selalu hilang tanpa peringatan.
ALTER TABLE "ShiftKasir" ADD COLUMN "catatan" TEXT;
