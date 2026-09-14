-- Mengganti password mencabut sesi di semua perangkat lain.
--
-- Sesi yang diterbitkan sebelum waktu ini ditolak. NULL (semua akun lama)
-- berarti belum pernah dicabut, jadi tidak ada yang terlempar oleh migrasi ini.

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "sesiBerlakuSejak" TIMESTAMP(3);
