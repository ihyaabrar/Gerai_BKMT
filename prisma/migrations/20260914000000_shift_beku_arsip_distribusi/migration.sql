-- Rekap kas shift dibekukan saat ditutup, dan rekaman distribusi yang dibuka
-- kembali diarsipkan alih-alih dihapus. Keduanya bersifat menambah; tidak ada
-- data yang diubah atau dihapus oleh migrasi ini.
--
-- Shift yang ditutup sebelum migrasi ini tetap bernilai NULL dan dihitung ulang
-- seperti sebelumnya saat ditampilkan.

-- AlterTable
ALTER TABLE "ShiftKasir" ADD COLUMN     "penjualanNonTunai" DOUBLE PRECISION,
ADD COLUMN     "penjualanTunai" DOUBLE PRECISION,
ADD COLUMN     "saldoSeharusnya" DOUBLE PRECISION,
ADD COLUMN     "selisih" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "DistribusiLabaArsip" (
    "id" TEXT NOT NULL,
    "periode" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "alasan" TEXT NOT NULL,
    "dibukaOlehId" TEXT,
    "dibukaPada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DistribusiLabaArsip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DistribusiLabaArsip_periode_dibukaPada_idx" ON "DistribusiLabaArsip"("periode", "dibukaPada");

-- CreateIndex
CREATE INDEX "DistribusiLabaArsip_dibukaOlehId_idx" ON "DistribusiLabaArsip"("dibukaOlehId");

-- AddForeignKey
ALTER TABLE "DistribusiLabaArsip" ADD CONSTRAINT "DistribusiLabaArsip_dibukaOlehId_fkey" FOREIGN KEY ("dibukaOlehId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

