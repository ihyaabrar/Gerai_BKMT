/**
 * Pesan saat permintaan ke server tidak mendapat jawaban (internet putus,
 * server sibuk). Menggantikan "Terjadi kesalahan" yang tidak memberi tahu
 * pengguna harus berbuat apa.
 */

/** Untuk membaca, mengubah, atau menghapus — aman diulang. */
export const CEK_INTERNET = "Periksa sambungan internet, lalu coba lagi.";

/**
 * Untuk menambah data baru (barang masuk, pengeluaran, dsb.). Bisa saja
 * server sudah menyimpan tetapi jawabannya hilang di jalan; mengulang tanpa
 * memeriksa dapat mencatat dua kali.
 */
export const CEK_SEBELUM_ULANG =
  "Sambungan terputus sebelum ada jawaban. Muat ulang halaman dan periksa apakah data sudah tersimpan sebelum mengulang.";
