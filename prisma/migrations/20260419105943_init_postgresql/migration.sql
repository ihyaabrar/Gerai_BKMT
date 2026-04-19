-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'kasir',
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Barang" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "barcode" TEXT,
    "nama" TEXT NOT NULL,
    "kategori" TEXT,
    "hargaBeli" DOUBLE PRECISION NOT NULL,
    "hargaJual" DOUBLE PRECISION NOT NULL,
    "stok" INTEGER NOT NULL DEFAULT 0,
    "stokMinimum" INTEGER NOT NULL DEFAULT 5,
    "satuan" TEXT NOT NULL DEFAULT 'pcs',
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Barang_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "telepon" TEXT,
    "alamat" TEXT,
    "poin" INTEGER NOT NULL DEFAULT 0,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nasabah" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "telepon" TEXT,
    "alamat" TEXT,
    "jumlahInvestasi" DOUBLE PRECISION NOT NULL,
    "persentase" DOUBLE PRECISION NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Nasabah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "telepon" TEXT,
    "alamat" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Penjualan" (
    "id" TEXT NOT NULL,
    "nomorTransaksi" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "memberId" TEXT,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "diskon" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "bayar" DOUBLE PRECISION NOT NULL,
    "kembalian" DOUBLE PRECISION NOT NULL,
    "metodeBayar" TEXT NOT NULL DEFAULT 'Tunai',
    "shiftId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Penjualan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetailPenjualan" (
    "id" TEXT NOT NULL,
    "penjualanId" TEXT NOT NULL,
    "barangId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "hargaJual" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DetailPenjualan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pengeluaran" (
    "id" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kategori" TEXT NOT NULL,
    "keterangan" TEXT NOT NULL,
    "jumlah" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pengeluaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftKasir" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jamBuka" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jamTutup" TIMESTAMP(3),
    "saldoAwal" DOUBLE PRECISION NOT NULL,
    "saldoAkhir" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'buka',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShiftKasir_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PenyesuaianStok" (
    "id" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "barangId" TEXT NOT NULL,
    "jenis" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "alasan" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PenyesuaianStok_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Retur" (
    "id" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "barangId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "alasan" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'proses',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Retur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pengaturan" (
    "id" TEXT NOT NULL,
    "namaToko" TEXT NOT NULL DEFAULT 'Gerai BKMT',
    "alamatToko" TEXT,
    "teleponToko" TEXT,
    "prefixTransaksi" TEXT NOT NULL DEFAULT 'TRX',
    "diskonMember" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "persenNasabah" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "persenPengelola" DOUBLE PRECISION NOT NULL DEFAULT 70,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pengaturan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KategoriBarang" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KategoriBarang_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KategoriPengeluaran" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KategoriPengeluaran_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Barang_kode_key" ON "Barang"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "Barang_barcode_key" ON "Barang"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "Member_kode_key" ON "Member"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "Penjualan_nomorTransaksi_key" ON "Penjualan"("nomorTransaksi");

-- CreateIndex
CREATE UNIQUE INDEX "KategoriBarang_nama_key" ON "KategoriBarang"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "KategoriPengeluaran_nama_key" ON "KategoriPengeluaran"("nama");

-- AddForeignKey
ALTER TABLE "Penjualan" ADD CONSTRAINT "Penjualan_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Penjualan" ADD CONSTRAINT "Penjualan_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "ShiftKasir"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetailPenjualan" ADD CONSTRAINT "DetailPenjualan_penjualanId_fkey" FOREIGN KEY ("penjualanId") REFERENCES "Penjualan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetailPenjualan" ADD CONSTRAINT "DetailPenjualan_barangId_fkey" FOREIGN KEY ("barangId") REFERENCES "Barang"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftKasir" ADD CONSTRAINT "ShiftKasir_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PenyesuaianStok" ADD CONSTRAINT "PenyesuaianStok_barangId_fkey" FOREIGN KEY ("barangId") REFERENCES "Barang"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Retur" ADD CONSTRAINT "Retur_barangId_fkey" FOREIGN KEY ("barangId") REFERENCES "Barang"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
