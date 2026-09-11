-- Harga pokok dibekukan pada baris detail penjualan.
ALTER TABLE "DetailPenjualan" ADD COLUMN "hargaBeli" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Transaksi lama diisi dengan harga beli barang yang berlaku sekarang. Itu
-- perkiraan terbaik yang tersedia; sejak migrasi ini nilainya tidak berubah lagi.
UPDATE "DetailPenjualan" d
SET "hargaBeli" = b."hargaBeli"
FROM "Barang" b
WHERE b."id" = d."barangId";

-- Idempotensi dan atribusi kasir pada penjualan.
ALTER TABLE "Penjualan" ADD COLUMN "idempotencyKey" TEXT;
ALTER TABLE "Penjualan" ADD COLUMN "userId" TEXT;

-- Atribusi pengguna pada catatan yang mengubah stok atau uang.
ALTER TABLE "Pengeluaran" ADD COLUMN "userId" TEXT;
ALTER TABLE "PenyesuaianStok" ADD COLUMN "userId" TEXT;
ALTER TABLE "Retur" ADD COLUMN "userId" TEXT;

-- Rekaman distribusi laba per periode.
CREATE TABLE "DistribusiLaba" (
    "id" TEXT NOT NULL,
    "periode" TEXT NOT NULL,
    "periodeMulai" TIMESTAMP(3) NOT NULL,
    "periodeSelesai" TIMESTAMP(3) NOT NULL,
    "totalPenjualan" DOUBLE PRECISION NOT NULL,
    "totalHpp" DOUBLE PRECISION NOT NULL,
    "totalDiskon" DOUBLE PRECISION NOT NULL,
    "labaKotor" DOUBLE PRECISION NOT NULL,
    "persenNasabah" DOUBLE PRECISION NOT NULL,
    "persenPengelola" DOUBLE PRECISION NOT NULL,
    "bagianNasabah" DOUBLE PRECISION NOT NULL,
    "bagianPengelola" DOUBLE PRECISION NOT NULL,
    "totalInvestasi" DOUBLE PRECISION NOT NULL,
    "catatan" TEXT,
    "dibuatOlehId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DistribusiLaba_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DistribusiLabaNasabah" (
    "id" TEXT NOT NULL,
    "distribusiId" TEXT NOT NULL,
    "nasabahId" TEXT NOT NULL,
    "namaNasabah" TEXT NOT NULL,
    "jumlahInvestasi" DOUBLE PRECISION NOT NULL,
    "persentase" DOUBLE PRECISION NOT NULL,
    "bagian" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "DistribusiLabaNasabah_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Penjualan_idempotencyKey_key" ON "Penjualan"("idempotencyKey");
CREATE UNIQUE INDEX "DistribusiLaba_periode_key" ON "DistribusiLaba"("periode");
CREATE UNIQUE INDEX "DistribusiLabaNasabah_distribusiId_nasabahId_key" ON "DistribusiLabaNasabah"("distribusiId", "nasabahId");

-- Indeks yang selama ini tidak ada: Prisma tidak membuat indeks foreign key
-- otomatis di PostgreSQL, jadi setiap join detail memindai seluruh tabel.
CREATE INDEX "Barang_aktif_nama_idx" ON "Barang"("aktif", "nama");
CREATE INDEX "Penjualan_tanggal_idx" ON "Penjualan"("tanggal");
CREATE INDEX "Penjualan_shiftId_idx" ON "Penjualan"("shiftId");
CREATE INDEX "Penjualan_memberId_idx" ON "Penjualan"("memberId");
CREATE INDEX "Penjualan_userId_idx" ON "Penjualan"("userId");
CREATE INDEX "DetailPenjualan_penjualanId_idx" ON "DetailPenjualan"("penjualanId");
CREATE INDEX "DetailPenjualan_barangId_idx" ON "DetailPenjualan"("barangId");
CREATE INDEX "Pengeluaran_tanggal_idx" ON "Pengeluaran"("tanggal");
CREATE INDEX "Pengeluaran_userId_idx" ON "Pengeluaran"("userId");
CREATE INDEX "ShiftKasir_userId_idx" ON "ShiftKasir"("userId");
CREATE INDEX "ShiftKasir_jamTutup_idx" ON "ShiftKasir"("jamTutup");
CREATE INDEX "PenyesuaianStok_tanggal_idx" ON "PenyesuaianStok"("tanggal");
CREATE INDEX "PenyesuaianStok_barangId_idx" ON "PenyesuaianStok"("barangId");
CREATE INDEX "PenyesuaianStok_userId_idx" ON "PenyesuaianStok"("userId");
CREATE INDEX "Retur_tanggal_idx" ON "Retur"("tanggal");
CREATE INDEX "Retur_barangId_idx" ON "Retur"("barangId");
CREATE INDEX "Retur_userId_idx" ON "Retur"("userId");
CREATE INDEX "DistribusiLaba_periodeMulai_idx" ON "DistribusiLaba"("periodeMulai");
CREATE INDEX "DistribusiLaba_dibuatOlehId_idx" ON "DistribusiLaba"("dibuatOlehId");
CREATE INDEX "DistribusiLabaNasabah_nasabahId_idx" ON "DistribusiLabaNasabah"("nasabahId");

ALTER TABLE "Penjualan" ADD CONSTRAINT "Penjualan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Pengeluaran" ADD CONSTRAINT "Pengeluaran_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PenyesuaianStok" ADD CONSTRAINT "PenyesuaianStok_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Retur" ADD CONSTRAINT "Retur_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DistribusiLaba" ADD CONSTRAINT "DistribusiLaba_dibuatOlehId_fkey" FOREIGN KEY ("dibuatOlehId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DistribusiLabaNasabah" ADD CONSTRAINT "DistribusiLabaNasabah_distribusiId_fkey" FOREIGN KEY ("distribusiId") REFERENCES "DistribusiLaba"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DistribusiLabaNasabah" ADD CONSTRAINT "DistribusiLabaNasabah_nasabahId_fkey" FOREIGN KEY ("nasabahId") REFERENCES "Nasabah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
