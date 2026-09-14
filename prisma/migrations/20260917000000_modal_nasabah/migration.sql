-- Riwayat modal nasabah: nasabah baru, perubahan modal, dan nasabah yang
-- berhenti berlaku mulai bulan berikutnya (keputusan pengurus, September 2026).
--
-- Rekaman distribusi yang sudah ditutup tidak tersentuh — angkanya dibekukan
-- saat ditutup.

-- CreateTable
CREATE TABLE "ModalNasabah" (
    "id" TEXT NOT NULL,
    "nasabahId" TEXT NOT NULL,
    "berlakuMulai" TEXT NOT NULL,
    "jumlah" DOUBLE PRECISION NOT NULL,
    "aktif" BOOLEAN NOT NULL,
    "dibuatOlehId" TEXT,
    "dibuatPada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diubahPada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModalNasabah_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ModalNasabah_berlakuMulai_idx" ON "ModalNasabah"("berlakuMulai");

-- CreateIndex
CREATE UNIQUE INDEX "ModalNasabah_nasabahId_berlakuMulai_key" ON "ModalNasabah"("nasabahId", "berlakuMulai");

-- AddForeignKey
ALTER TABLE "ModalNasabah" ADD CONSTRAINT "ModalNasabah_nasabahId_fkey" FOREIGN KEY ("nasabahId") REFERENCES "Nasabah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Nasabah yang sudah ada: modal dan statusnya hari ini dianggap berlaku untuk
-- semua periode yang belum ditutup — sama persis dengan cara distribusi
-- dihitung sebelum migrasi ini, jadi pratinjau tidak berubah.
INSERT INTO "ModalNasabah" ("id", "nasabahId", "berlakuMulai", "jumlah", "aktif", "dibuatPada", "diubahPada")
SELECT 'awal_' || "id", "id", '2000-01', "jumlahInvestasi", "aktif", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Nasabah";
