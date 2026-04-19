-- CreateTable
CREATE TABLE "KategoriBarang" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "KategoriPengeluaran" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "KategoriBarang_nama_key" ON "KategoriBarang"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "KategoriPengeluaran_nama_key" ON "KategoriPengeluaran"("nama");
