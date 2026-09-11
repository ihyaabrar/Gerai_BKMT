-- Pembatalan penjualan. Penjualan tidak pernah dihapus: struk yang sudah
-- dicetak tetap ada di dunia nyata, dan pertanyaannya akan muncul lagi.
ALTER TABLE "Penjualan" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'selesai';
ALTER TABLE "Penjualan" ADD COLUMN "alasanBatal" TEXT;
ALTER TABLE "Penjualan" ADD COLUMN "dibatalkanPada" TIMESTAMP(3);
ALTER TABLE "Penjualan" ADD COLUMN "dibatalkanOlehId" TEXT;

CREATE INDEX "Penjualan_status_tanggal_idx" ON "Penjualan"("status", "tanggal");

ALTER TABLE "Penjualan" ADD CONSTRAINT "Penjualan_dibatalkanOlehId_fkey" FOREIGN KEY ("dibatalkanOlehId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
