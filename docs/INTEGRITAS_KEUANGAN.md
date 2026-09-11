# Integritas Keuangan & Bagi Hasil

Catatan ini menjelaskan bagaimana angka keuangan Gerai BKMT dihitung, dan apa
yang berubah setelah perbaikan September 2026. Ditujukan untuk pengurus, bukan
hanya untuk yang mengerti kode.

---

## 1. Bagaimana "laba" dihitung

Satu definisi saja, dipakai di seluruh aplikasi:

```
Laba kotor = Uang yang diterima − Harga pokok barang yang terjual
Laba bersih = Laba kotor − Biaya operasional
```

Yang perlu dipahami:

- **"Uang yang diterima" sudah dipotong diskon member.** Jadi diskon tidak
  dikurangkan lagi. Dulu diskon tidak pernah dikurangkan sama sekali, sehingga
  laba dilaporkan lebih besar daripada kenyataan.
- **"Harga pokok" adalah harga beli saat barang itu terjual**, bukan harga beli
  hari ini. Kalau harga beli gula naik bulan depan, laba bulan ini tidak ikut
  berubah.
- **"Biaya operasional" tidak termasuk kategori "Pembelian Barang".** Pembelian
  barang dagangan sudah terhitung sebagai harga pokok pada setiap penjualan;
  menguranginya lagi berarti menghitung modal barang dua kali.

Semua rumus ini ada di satu berkas: `src/lib/keuangan.ts`. Perubahan apa pun
pada cara menghitung laba harus dilakukan di sana, bukan di halaman.

---

## 2. Menutup distribusi bagi hasil

**Menu: Keuangan → Distribusi Laba**

Setiap periode punya dua keadaan:

| Keadaan | Artinya |
|---|---|
| **Pratinjau** | Angka dihitung ulang setiap halaman dibuka. Masih bisa berubah kalau ada transaksi baru, harga barang diubah, atau daftar nasabah berubah. |
| **Ditutup** | Angka sudah dibekukan. Tidak akan berubah lagi, apa pun yang terjadi setelahnya. |

### Cara menutup periode

1. Tunggu sampai bulannya **benar-benar berakhir**. Sistem menolak menutup bulan
   yang masih berjalan — transaksi yang masuk sampai tanggal terakhir masih akan
   mengubah angkanya.
2. Buka halaman Distribusi Laba, pilih periodenya.
3. Periksa angkanya. Bagian "Dari Mana Angka Laba Ini" menunjukkan
   penjualan dikurangi harga pokok.
4. Tekan **Tutup & Simpan**.

Yang disimpan: laba, harga pokok, diskon, rasio bagi hasil, total investasi,
serta **nama, modal, persentase, dan bagian setiap nasabah saat itu**. Nama ikut
disalin supaya rekaman tetap terbaca walau nasabahnya kemudian keluar.

### Kenapa ini penting

Kalau ada anggota bertanya *"kenapa bagian saya bulan Juli segini?"*, jawabannya
ada di rekaman periode Juli — bukan hasil perhitungan ulang memakai daftar
nasabah hari ini. Sebelum ada rekaman ini, sistem tidak punya jawaban.

### Membuka kembali periode

Hanya **master** yang bisa. Rekamannya dihapus dan periode harus ditutup ulang.
Gunakan hanya kalau memang ada kesalahan data yang sudah diperbaiki — bukan
untuk "menghitung ulang biar lebih bagus".

---

## 3. Pembulatan

Pembagian pro-rata hampir selalu menghasilkan pecahan rupiah. Aturannya:

- Semua bagian dibulatkan ke rupiah penuh.
- Sisa pembulatan diberikan ke porsi terbesar lebih dulu.
- **Jumlah seluruh bagian selalu persis sama dengan total yang dibagikan.**

Contoh: laba Rp 1.000.000, bagian nasabah 30% = Rp 300.000, dibagi tiga nasabah
dengan modal 5 : 3 : 2 juta → Rp 150.000, Rp 90.000, Rp 60.000. Jumlahnya persis
Rp 300.000.

---

## 4. Bulan rugi — keputusan yang perlu pengurus sepakati

Kalau sebuah periode **tidak menghasilkan laba**, sistem saat ini:

- memberi bagian **nol** kepada seluruh nasabah (bukan angka negatif),
- membebankan kerugian sepenuhnya ke pengelola.

Ini keputusan kebijakan yang dipilih sebagai bawaan, **bukan keharusan teknis**.
Kalau pengurus memutuskan lain — misalnya kerugian ikut mengurangi modal
nasabah — kebijakan itu harus diubah lebih dulu di
`src/app/api/distribusi/route.ts` sebelum periode rugi ditutup.

---

## 5. Siapa boleh apa

| Tindakan | Kasir | Admin | Master |
|---|:---:|:---:|:---:|
| Melayani penjualan | ✅ | ✅ | ✅ |
| Mencatat barang masuk (stok bertambah) | ✅ | ✅ | ✅ |
| Penyesuaian stok (dengan alasan) | ✅ | ✅ | ✅ |
| Mendaftarkan barang baru | ❌ | ✅ | ✅ |
| Mengubah harga beli / harga jual | ❌ | ✅ | ✅ |
| Menghapus barang | ❌ | ✅ | ✅ |
| Melihat angka laba | ❌ | ✅ | ✅ |
| Laporan keuangan & distribusi | ❌ | ✅ | ✅ |
| Membatalkan penjualan | ❌ | ✅ | ✅ |
| Menutup distribusi | ❌ | ✅ | ✅ |
| Membuka kembali distribusi | ❌ | ❌ | ✅ |
| Mengelola pengguna | ❌ | ❌ | ✅ |

Alasan kasir tidak boleh menyentuh harga: harga beli menentukan laba, dan laba
menentukan bagi hasil nasabah. Menambah stok tidak punya efek itu, jadi tetap
boleh.

Semua pencatatan yang mengubah uang atau stok — penjualan, pengeluaran,
penyesuaian stok, retur — sekarang menyimpan **siapa yang membuatnya**.

Menonaktifkan pengguna langsung mencabut aksesnya, tidak menunggu sesinya
kedaluwarsa. Begitu juga penurunan role: admin yang diturunkan jadi kasir
kehilangan akses pengelola pada klik berikutnya.

---

## 6. Membatalkan penjualan

**Menu: Keuangan → Penjualan → tombol ⃠ pada barisnya**

Kasir salah input jumlah, atau pembeli membatalkan pesanan. Pengelola bisa
membatalkan transaksinya. Yang terjadi:

- Stok dikembalikan.
- Poin member ditarik kembali sebanyak yang dulu diberikan.
- Transaksinya **tidak dihapus**. Struk yang sudah dicetak tetap ada di dunia
  nyata, jadi yang tersimpan adalah statusnya, alasannya, waktunya, dan siapa
  yang membatalkan. Daftar penjualan tetap menampilkannya, dicoret.
- Transaksi itu hilang dari semua perhitungan: laporan, laba, rekap kas shift,
  dan distribusi bagi hasil.

Alasan pembatalan **wajib diisi**. Itulah yang dibaca kalau pertanyaannya
muncul lagi bulan depan.

### Kalau periodenya sudah ditutup

Sistem **menolak** membatalkan transaksi pada bulan yang distribusinya sudah
ditutup — bagi hasil bulan itu sudah dihitung dan mungkin sudah dibayarkan.

Urutan yang benar kalau memang harus diperbaiki:

1. Master membuka kembali periode itu (Distribusi Laba → Buka Kembali).
2. Batalkan transaksinya.
3. Tutup ulang periodenya.
4. **Beri tahu nasabah** kalau angkanya berubah setelah dibayarkan. Sistem bisa
   menghitung ulang; kepercayaan tidak bisa.

---

## 7. Rekap kas shift

Selisih kas dihitung **hanya dari penjualan tunai**:

```
Saldo seharusnya = Saldo awal + Penjualan tunai
Selisih = Saldo akhir (dihitung manual) − Saldo seharusnya
```

Pembayaran transfer, QRIS, dan debit ditampilkan terpisah karena uangnya tidak
pernah masuk ke laci. Sebelum perbaikan ini, semua pembayaran dihitung sebagai
uang laci, sehingga setiap shift dengan pembayaran non-tunai tampak kekurangan
uang — dan kasirnya yang dicurigai.

---

## 8. Transaksi ganda

Kasir bekerja dari HP atau tablet di jaringan yang tidak selalu stabil. Kalau
koneksi terputus tepat setelah tombol Bayar ditekan, aplikasi tidak bisa tahu
apakah transaksinya sudah masuk atau belum.

Sekarang aman: **tekan Bayar lagi.** Setiap keranjang membawa penanda unik, dan
server mengenali percobaan kedua sebagai transaksi yang sama. Struk yang keluar
adalah struk transaksi yang pertama, bukan transaksi baru.

---

## 9. Ekspor data

**Menu: Sistem → Ekspor Data**

Pilih bulannya, lalu unduh. Berkas JSON berisi data induk lengkap ditambah
transaksi bulan itu, termasuk rekaman distribusi bagi hasil. Password pengguna
tidak pernah disertakan.

**Ini bukan pengaman utama data Anda.** Backup yang bergantung pada seseorang
menekan tombol setiap minggu adalah backup yang tidak ada. Yang benar-benar
melindungi adalah backup otomatis penyedia database — aktifkan itu sekali, dan
tidak ada yang perlu diingat lagi.

Ekspor "Seluruh data" akan ditolak kalau ukurannya melewati batas; pesannya
akan memberi tahu untuk mengekspor per bulan saja.

---

## 10. Kalau ada yang error

Setiap kegagalan yang tidak terduga menampilkan **kode enam karakter**,
misalnya `Gagal memproses transaksi. Kode kesalahan: BX7K2P`.

Minta kasir membacakan kodenya. Kode itu juga tercetak di log server, jadi
itulah cara menemukan apa yang sebenarnya terjadi. Tanpa kode itu, pesan
"gagal" tidak bisa dihubungkan ke apa pun — dan log runtime Vercel paket Hobby
hanya bertahan satu jam.

---

## 11. Sebelum dipakai untuk uang sungguhan

- [ ] `AUTH_SECRET` diisi minimal 32 karakter acak. Aplikasi **menolak jalan**
      tanpa ini di mana pun selain mesin pengembang — termasuk di preview
      Vercel. Buat dengan `openssl rand -base64 32`.
- [ ] `SEED_ADMIN_PASSWORD` dan `SEED_KASIR_PASSWORD` ditentukan sendiri —
      **jangan** pakai `admin123` / `kasir123`
- [ ] Database dibuat di region **Singapura** agar cocok dengan
      `vercel.json` (`"regions": ["sin1"]`). Beda region menambah sekitar
      200 ms pada setiap kali aplikasi menghubungi database.
- [ ] Backup otomatis provider diaktifkan (point-in-time restore). Tombol
      backup di aplikasi adalah pelengkap, bukan andalan.
- [ ] Rasio bagi hasil di Pengaturan diperiksa (bawaan 30% nasabah /
      70% pengelola)
- [ ] Daftar nasabah dan jumlah investasinya diperiksa sebelum periode pertama
      ditutup
- [ ] Migrasi database berjalan otomatis saat build di Vercel lewat skrip
      `vercel-build`. Kalau deploy di tempat lain, jalankan
      `npm run db:migrate` sendiri sebelum aplikasi dipakai.
- [ ] Kalau memakai connection pooling (Neon pooled / Supabase port 6543),
      tambahkan `directUrl` pada `prisma/schema.prisma` — tanpa itu
      `prisma migrate deploy` akan gagal terhadap PgBouncer. Sengaja belum
      ditambahkan karena bergantung pada cara database Anda dibuat.

---

## 12. Catatan keamanan yang sudah diputuskan

Beberapa hal sengaja **tidak** dikerjakan, dengan alasannya:

| Tidak dikerjakan | Alasan |
|---|---|
| Redis untuk rate limit login | Menambah layanan berbayar, kredensial, dan titik gagal baru demi melindungi tiga akun yang sudah dilindungi bcrypt cost 12 (~500 ms per percobaan). Kalau memang perlu, pakai Vercel WAF — tanpa kode. |
| Naik ke Next.js 15 / 16 | Migrasi besar untuk aplikasi yang dirawat relawan. Jalur 14.x masih menerima tambalan keamanan; versi terpasang sudah menambal CVE-2025-29927. |
| Layanan pemantauan (Sentry dll.) | Butuh akun dan DSN yang harus Anda buat sendiri. Sebagai gantinya, setiap kesalahan punya kode enam karakter yang bisa dibacakan kasir lewat telepon dan dicari di log. Kalau nanti ingin Sentry, tinggal ditambahkan. |
| POS offline-first | Bukan fitur, melainkan sistem terdistribusi: konflik stok antar kasir tidak punya jawaban teknis, hanya kebijakan yang harus diputuskan manusia lalu diajarkan ke relawan. Untuk pemadaman jaringan, modem cadangan dari operator kedua menyelesaikannya hari ini tanpa satu baris kode. |
| Pembukuan berpasangan (double-entry) | Kompleksitas yang tidak sepadan pada skala satu toko. Yang dibutuhkan — bisa menjelaskan angka bulan lalu — sudah dijawab oleh rekaman distribusi. |

---

## 13. Menjalankan pengujian

```bash
npm test                          # 34 uji perhitungan, periode WIB, sesi, gambar
bash scripts/smoke-test.sh        # 71 uji hak akses, pencabutan sesi, bypass middleware
node scripts/uji-distribusi.mjs   # 22 uji rekaman bagi hasil
node scripts/uji-idempotensi.mjs  # 17 uji transaksi ganda & stok
node scripts/uji-pembatalan.mjs   # 32 uji pembatalan penjualan
```

Totalnya 176 pemeriksaan otomatis. Sebelum perbaikan September 2026 hanya ada
56, dan semuanya tentang hak akses — tidak satu pun menyentuh perhitungan uang.

Tiga skrip terakhir butuh server berjalan (`npm run build && npm start`) dan
**menulis ke database** — jalankan hanya terhadap database uji, tidak pernah
terhadap produksi.
