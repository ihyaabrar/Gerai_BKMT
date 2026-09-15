/**
 * Isi halaman Cara Pakai. Ditulis sebagai data supaya tautan setiap panduan
 * bisa diuji terhadap hak akses (lihat __tests__/panduan.test.ts): panduan
 * kasir tidak boleh menyuruh membuka halaman yang tertutup bagi kasir.
 */

export type Pembaca = "semua" | "pengurus";

export interface Panduan {
  id: string;
  judul: string;
  /** Kapan panduan ini dipakai, satu kalimat. */
  kapan: string;
  pembaca: Pembaca;
  langkah: string[];
  /** Hal yang sering keliru. */
  perhatian?: string[];
  tautan?: { label: string; href: string };
}

export const PANDUAN: Panduan[] = [
  {
    id: "buka-kasir",
    judul: "Buka kasir",
    kapan: "Setiap pagi, sebelum transaksi pertama.",
    pembaca: "semua",
    langkah: [
      "Buka menu Kasir. Bila muncul kotak kuning \"Kasir belum dibuka\", tekan Buka Kasir.",
      "Hitung semua uang tunai yang ada di laci.",
      "Tulis jumlahnya, lalu tekan Buka Kasir. Kalau laci kosong, tulis 0.",
    ],
    perhatian: [
      "Hanya boleh ada satu kasir yang terbuka. Kalau kasir kemarin lupa ditutup, tutup dulu lewat menu Buka / Tutup Kasir.",
    ],
    tautan: { label: "Buka halaman Kasir", href: "/app/kasir" },
  },
  {
    id: "jualan",
    judul: "Melayani pembeli",
    kapan: "Setiap ada pembeli.",
    pembaca: "semua",
    langkah: [
      "Di halaman Kasir, ketuk barang yang dibeli. Barang bisa dicari dengan mengetik nama, atau tekan Scan Barcode.",
      "Atur jumlah dengan tombol − dan + di keranjang.",
      "Kalau pembeli terdaftar sebagai member, tekan Member lalu pilih namanya — diskon member terpasang otomatis.",
      "Tekan Bayar, lalu pilih cara bayar: Tunai, Transfer, atau QRIS.",
      "Untuk tunai: tekan Uang Pas, pilih nominal uang dari pembeli, atau ketik jumlahnya. Kembalian muncul di bawahnya.",
      "Tekan Selesaikan Pembayaran. Struk tampil dan bisa dicetak.",
    ],
    perhatian: [
      "Kalau muncul tulisan merah \"Uang kurang\", tombol bayar belum bisa ditekan — periksa lagi uang dari pembeli.",
      "Untuk Transfer dan QRIS, pastikan uang sudah masuk sebelum menekan Selesaikan Pembayaran.",
      "Kalau internet putus saat membayar, tekan tombol bayar sekali lagi. Sistem memastikan transaksi tidak tercatat dua kali.",
    ],
    tautan: { label: "Buka halaman Kasir", href: "/app/kasir" },
  },
  {
    id: "cetak-ulang",
    judul: "Cetak ulang struk",
    kapan: "Pembeli minta struk lagi, atau struk tadi gagal tercetak.",
    pembaca: "semua",
    langkah: [
      "Buka menu Riwayat Penjualan.",
      "Cari transaksinya (ketik nomor transaksi atau lihat jam dan jumlahnya).",
      "Tekan Struk, lalu Cetak Struk. Struk ulang diberi tanda salinan.",
    ],
    tautan: { label: "Buka Riwayat Penjualan", href: "/app/keuangan/penjualan" },
  },
  {
    id: "tutup-kasir",
    judul: "Tutup kasir",
    kapan: "Setiap selesai berjualan, sebelum pulang.",
    pembaca: "semua",
    langkah: [
      "Buka menu Buka / Tutup Kasir, tekan Tutup Kasir.",
      "Keluarkan dan hitung semua uang tunai di laci.",
      "Tulis jumlahnya apa adanya — walau terasa kurang atau lebih. Tambahkan catatan bila perlu.",
      "Tekan Tutup Kasir. Hasilnya tampil: Cocok, Lebih, atau Kurang.",
    ],
    perhatian: [
      "Jangan menyesuaikan angka supaya terlihat cocok. Selisih yang dicatat jujur membantu pengurus mencari penyebabnya.",
      "Uang transfer dan QRIS tidak masuk laci, jadi tidak ikut dihitung.",
    ],
    tautan: { label: "Buka / Tutup Kasir", href: "/app/sistem/shift" },
  },
  {
    id: "barang-masuk",
    judul: "Barang datang dari supplier",
    kapan: "Saat menerima kiriman atau belanja barang dagangan.",
    pembaca: "semua",
    langkah: [
      "Buka menu Barang Masuk.",
      "Barang yang sudah ada: pilih Tambah Stok, cari barangnya, lalu isi jumlah yang datang. Bila harga belinya berubah, pengurus mencentang \"Harga beli pembelian ini berbeda\".",
      "Barang yang belum pernah dijual: pilih Barang Baru, isi nama, harga beli, harga jual, dan stok awal. Kode barang bisa dibuat otomatis.",
      "Tekan tombol simpan. Stok bertambah dan uang belanjanya tercatat sebagai pengeluaran.",
    ],
    perhatian: [
      "Jangan menambah stok lewat Barang Rusak / Hilang — di sana tidak tercatat sebagai belanja.",
    ],
    tautan: { label: "Buka Barang Masuk", href: "/app/inventori/barang-masuk" },
  },
  {
    id: "barang-rusak",
    judul: "Barang rusak, hilang, atau kedaluwarsa",
    kapan: "Saat menemukan barang yang tidak bisa dijual, atau jumlah di rak tidak sama dengan di aplikasi.",
    pembaca: "semua",
    langkah: [
      "Buka menu Barang Rusak / Hilang.",
      "Pilih barangnya, lalu pilih − Kurangi.",
      "Isi jumlah dan alasannya (mis. \"kemasan bocor\").",
      "Periksa \"Stok setelah disimpan\", lalu tekan Simpan.",
    ],
    perhatian: [
      "Nilai barang yang dikurangi mengurangi laba bulan itu, termasuk bagi hasil nasabah.",
      "Pilih + Tambah hanya bila ternyata salah hitung dan barangnya ada.",
    ],
    tautan: { label: "Buka Barang Rusak / Hilang", href: "/app/inventori/penyesuaian" },
  },
  {
    id: "pengeluaran",
    judul: "Mencatat pengeluaran",
    kapan: "Membayar listrik, plastik, transport, dan biaya lain di luar belanja barang dagangan.",
    pembaca: "semua",
    langkah: [
      "Buka menu Pengeluaran (untuk kasir ada di bagian Lainnya).",
      "Tekan Tambah Pengeluaran, pilih kategori, isi jumlah dan keterangan.",
      "Tekan simpan.",
    ],
    tautan: { label: "Buka Pengeluaran", href: "/app/keuangan/pengeluaran" },
  },
  {
    id: "printer",
    judul: "Menyambungkan printer struk",
    kapan: "Pertama kali memakai HP atau komputer kasir yang baru.",
    pembaca: "semua",
    langkah: [
      "Buka menu Printer.",
      "Printer thermal Bluetooth: nyalakan printer dan Bluetooth HP, tekan Pilih printer, lalu pilih printernya.",
      "Printer biasa (USB/WiFi): pilih Printer sistem.",
      "Pilih lebar kertas (58 mm atau 80 mm), lalu tekan Cetak uji.",
    ],
    perhatian: [
      "Printer Bluetooth hanya bisa dari Google Chrome di Android atau komputer. Di iPhone, pakai Printer sistem.",
      "Pengaturan printer tersimpan per HP/komputer — setiap perangkat diatur sendiri.",
    ],
    tautan: { label: "Buka pengaturan Printer", href: "/app/sistem/printer" },
  },
  {
    id: "kata-sandi",
    judul: "Mengganti kata sandi",
    kapan: "Setelah pertama kali diberi akun, atau bila kata sandi diketahui orang lain.",
    pembaca: "semua",
    langkah: [
      "Ketuk nama Anda di bagian bawah menu.",
      "Isi kata sandi lama dan kata sandi baru (minimal 8 huruf/angka), lalu simpan.",
    ],
    perhatian: [
      "Lupa kata sandi? Minta pengurus utama menggantinya lewat Pengaturan → Pengguna.",
    ],
    tautan: { label: "Buka Akun Saya", href: "/app/akun" },
  },

  // ── Pengurus ──
  {
    id: "retur-pembeli",
    judul: "Pembeli mengembalikan barang / transaksi salah",
    kapan: "Barang yang dibeli rusak atau salah, atau kasir salah memasukkan transaksi.",
    pembaca: "pengurus",
    langkah: [
      "Buka Riwayat Penjualan dan cari transaksinya.",
      "Sebagian barang dikembalikan: tekan Retur, isi jumlah dan alasannya, lalu Catat Retur. Stok kembali dan uang pengembalian tercatat.",
      "Seluruh transaksi salah: tekan Batalkan dan tulis alasannya. Stok dikembalikan.",
    ],
    perhatian: [
      "Transaksi yang sudah diretur tidak bisa dibatalkan lagi.",
      "Pengembalian tunai diambil dari laci kasir yang sedang buka, jadi ikut dihitung saat tutup kasir.",
    ],
    tautan: { label: "Buka Riwayat Penjualan", href: "/app/keuangan/penjualan" },
  },
  {
    id: "retur-supplier",
    judul: "Mengembalikan barang ke supplier",
    kapan: "Barang rusak atau kedaluwarsa yang akan ditukar atau dikembalikan ke pemasok.",
    pembaca: "pengurus",
    langkah: [
      "Buka Retur ke Supplier, tekan Tambah Retur Barang.",
      "Pilih barang, isi jumlah dan alasan. Status awalnya \"proses\" dan stok belum berkurang.",
      "Setelah barang benar-benar diserahkan ke supplier, tekan Selesai. Stok baru berkurang saat itu.",
    ],
    tautan: { label: "Buka Retur ke Supplier", href: "/app/inventori/retur" },
  },
  {
    id: "bagi-hasil",
    judul: "Bagi hasil nasabah setiap bulan",
    kapan: "Awal bulan, untuk bulan yang baru selesai.",
    pembaca: "pengurus",
    langkah: [
      "Pastikan transaksi bulan lalu sudah benar (retur dan pembatalan sudah dicatat).",
      "Buka Bagi Hasil Nasabah dan pilih bulan lalu.",
      "Periksa laba dan bagian setiap nasabah.",
      "Tekan Tutup & Simpan. Angkanya dikunci dan tidak berubah lagi.",
      "Tekan Slip di baris nasabah untuk mencetak atau Kirim lewat WhatsApp, atau Semua slip untuk mencetak sekaligus.",
    ],
    perhatian: [
      "Bulan yang sedang berjalan belum bisa ditutup.",
      "Persentase bagi hasil di Pengaturan Toko tidak bisa diubah sebelum bulan lalu ditutup.",
      "Kalau ternyata ada kesalahan setelah ditutup, pengurus utama bisa Buka Kembali dengan alasan. Angka lama tetap tersimpan di arsip.",
    ],
    tautan: { label: "Buka Bagi Hasil Nasabah", href: "/app/keuangan/distribusi" },
  },
  {
    id: "nasabah",
    judul: "Mengelola nasabah dan modalnya",
    kapan: "Ada nasabah baru, modal bertambah/berkurang, atau nasabah berhenti.",
    pembaca: "pengurus",
    langkah: [
      "Buka Kontak → Nasabah (Pemodal). Nasabah baru: tekan Tambah Nasabah, isi nama, telepon (untuk WhatsApp), dan modal.",
      "Modal bertambah atau berkurang: tekan ikon pensil, pilih \"Tambah atau kurangi modal\" — berlaku mulai bulan berikutnya.",
      "Salah ketik angka modal: pilih \"Koreksi salah ketik\" — langsung berlaku.",
      "Nasabah berhenti: tekan ikon tempat sampah lalu pilih \"Berhenti menjadi nasabah\". Riwayat bagi hasilnya tetap ada.",
      "Data contoh atau salah input: tekan ikon tempat sampah lalu pilih \"Salah input / data contoh\".",
    ],
    tautan: { label: "Buka Nasabah", href: "/app/master/nasabah" },
  },
  {
    id: "pengguna",
    judul: "Menambah akun kasir",
    kapan: "Ada relawan kasir baru, atau seseorang tidak lagi bertugas.",
    pembaca: "pengurus",
    langkah: [
      "Buka Pengaturan → Pengguna (hanya pengurus utama), tekan Tambah Pengguna.",
      "Isi nama, nama pengguna, kata sandi awal, dan pilih peran Kasir.",
      "Berikan nama pengguna dan kata sandi awal kepada kasir, minta ia segera menggantinya.",
      "Yang tidak bertugas lagi: tekan Nonaktifkan. Riwayat transaksinya tetap ada.",
    ],
    tautan: { label: "Buka Pengguna", href: "/app/sistem/pengguna" },
  },
  {
    id: "unduh-data",
    judul: "Menyimpan salinan data",
    kapan: "Setiap awal bulan, setelah bagi hasil ditutup.",
    pembaca: "pengurus",
    langkah: [
      "Buka Pengaturan → Unduh Data (Excel).",
      "Pilih bulan (atau seluruh data), lalu unduh.",
      "Simpan file-nya di dua tempat, mis. laptop dan Google Drive pengurus.",
    ],
    perhatian: ["Salinan tidak dibuat otomatis — lakukan sendiri secara rutin."],
    tautan: { label: "Buka Unduh Data", href: "/app/sistem/backup" },
  },
  {
    id: "situs-web",
    judul: "Memperbarui situs web organisasi",
    kapan: "Ada berita, kegiatan, foto, atau perubahan susunan pengurus.",
    pembaca: "pengurus",
    langkah: [
      "Buka Kelola Situs Web di bagian bawah menu.",
      "Berita: tulis judul dan isi, pilih Simpan dulu (draf) atau Terbitkan, lalu tekan tombol simpan di bawah.",
      "Pengurus: isi nama, jabatan, tingkatan, dan cabang untuk Pimpinan Cabang. Urutan di bagan mengikuti jabatan.",
      "Galeri dan Agenda: tambah foto atau jadwal kegiatan. Agenda yang sudah lewat hilang sendiri dari situs.",
      "Profil Organisasi: logo, visi misi, sejarah, kontak, dan media sosial.",
    ],
    tautan: { label: "Buka Kelola Situs Web", href: "/admin" },
  },
];
