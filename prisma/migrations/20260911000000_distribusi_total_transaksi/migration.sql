-- Jumlah transaksi ikut dibekukan. Rekaman distribusi harus bisa dibaca
-- sendiri tanpa menghitung ulang apa pun dari tabel penjualan.
ALTER TABLE "DistribusiLaba" ADD COLUMN "totalTransaksi" INTEGER NOT NULL DEFAULT 0;
