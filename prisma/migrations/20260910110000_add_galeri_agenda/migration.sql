-- Galeri foto kegiatan dan agenda kegiatan, dua bagian yang ada di desain
-- panel admin maupun halaman publik tetapi belum punya tabelnya.

CREATE TABLE "Galeri" (
    "id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "deskripsi" TEXT,
    "gambarUrl" TEXT NOT NULL,
    "kategori" TEXT,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Galeri_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgendaKegiatan" (
    "id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "deskripsi" TEXT,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "waktuMulai" TEXT,
    "waktuSelesai" TEXT,
    "lokasi" TEXT,
    "kategori" TEXT,
    "status" TEXT NOT NULL DEFAULT 'terjadwal',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgendaKegiatan_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AgendaKegiatan_tanggal_idx" ON "AgendaKegiatan"("tanggal");
