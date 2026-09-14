-- Retur pembeli: pengembalian sebagian/seluruh barang dari penjualan yang sah.
--
-- Hanya menambah tabel dan kolom. Rekaman distribusi dan shift yang sudah
-- ditutup mendapat 0 / NULL, jadi angkanya tidak berubah.

-- AlterTable
ALTER TABLE "DistribusiLaba" ADD COLUMN     "hppRetur" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalRetur" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ShiftKasir" ADD COLUMN     "refundTunai" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "ReturPenjualan" (
    "id" TEXT NOT NULL,
    "nomor" TEXT NOT NULL,
    "penjualanId" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alasan" TEXT NOT NULL,
    "totalRefund" DOUBLE PRECISION NOT NULL,
    "hppKembali" DOUBLE PRECISION NOT NULL,
    "metodeRefund" TEXT NOT NULL,
    "shiftId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReturPenjualan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetailReturPenjualan" (
    "id" TEXT NOT NULL,
    "returId" TEXT NOT NULL,
    "detailPenjualanId" TEXT NOT NULL,
    "barangId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "refund" DOUBLE PRECISION NOT NULL,
    "hargaBeli" DOUBLE PRECISION NOT NULL,
    "kembaliKeStok" BOOLEAN NOT NULL,

    CONSTRAINT "DetailReturPenjualan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReturPenjualan_nomor_key" ON "ReturPenjualan"("nomor");

-- CreateIndex
CREATE INDEX "ReturPenjualan_tanggal_idx" ON "ReturPenjualan"("tanggal");

-- CreateIndex
CREATE INDEX "ReturPenjualan_penjualanId_idx" ON "ReturPenjualan"("penjualanId");

-- CreateIndex
CREATE INDEX "ReturPenjualan_shiftId_idx" ON "ReturPenjualan"("shiftId");

-- CreateIndex
CREATE INDEX "DetailReturPenjualan_returId_idx" ON "DetailReturPenjualan"("returId");

-- CreateIndex
CREATE INDEX "DetailReturPenjualan_detailPenjualanId_idx" ON "DetailReturPenjualan"("detailPenjualanId");

-- CreateIndex
CREATE INDEX "DetailReturPenjualan_barangId_idx" ON "DetailReturPenjualan"("barangId");

-- AddForeignKey
ALTER TABLE "ReturPenjualan" ADD CONSTRAINT "ReturPenjualan_penjualanId_fkey" FOREIGN KEY ("penjualanId") REFERENCES "Penjualan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturPenjualan" ADD CONSTRAINT "ReturPenjualan_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "ShiftKasir"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturPenjualan" ADD CONSTRAINT "ReturPenjualan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetailReturPenjualan" ADD CONSTRAINT "DetailReturPenjualan_returId_fkey" FOREIGN KEY ("returId") REFERENCES "ReturPenjualan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetailReturPenjualan" ADD CONSTRAINT "DetailReturPenjualan_detailPenjualanId_fkey" FOREIGN KEY ("detailPenjualanId") REFERENCES "DetailPenjualan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetailReturPenjualan" ADD CONSTRAINT "DetailReturPenjualan_barangId_fkey" FOREIGN KEY ("barangId") REFERENCES "Barang"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

