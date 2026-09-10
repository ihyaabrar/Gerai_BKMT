-- Foto produk ditampilkan pada halaman kasir dan inventori sesuai desain,
-- tetapi tabel Barang belum punya kolom untuk menyimpannya.
ALTER TABLE "Barang" ADD COLUMN "gambarUrl" TEXT;
