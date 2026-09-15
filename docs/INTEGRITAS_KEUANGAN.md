# Integritas Keuangan & Bagi Hasil

Catatan ini menjelaskan bagaimana angka keuangan Gerai BKMT dihitung, dan apa
yang berubah setelah perbaikan September 2026. Ditujukan untuk pengurus, bukan
hanya untuk yang mengerti kode.

---

## 1. Bagaimana "laba" dihitung

Satu definisi saja, dipakai di seluruh aplikasi:

```
Laba kotor   = Uang yang diterima − Harga pokok barang yang terjual − Retur pembeli
Laba dibagi  = Laba kotor − Nilai barang rusak/hilang      ← dasar bagi hasil nasabah
Laba bersih  = Laba dibagi − Biaya operasional
```

Yang perlu dipahami:

- **"Uang yang diterima" sudah dipotong diskon member.** Jadi diskon tidak
  dikurangkan lagi. Dulu diskon tidak pernah dikurangkan sama sekali, sehingga
  laba dilaporkan lebih besar daripada kenyataan.
- **"Harga pokok" adalah harga beli saat barang itu terjual**, bukan harga beli
  hari ini. Kalau harga beli gula naik bulan depan, laba bulan ini tidak ikut
  berubah.
- **Harga beli barang adalah rata-rata**, bukan harga pembelian terakhir.
  Contoh: di rak ada 10 pcs @ Rp4.000, lalu masuk 10 pcs @ Rp5.000 → harga beli
  menjadi Rp4.500. Dulu harga lama ditimpa Rp5.000, sehingga 10 pcs lama ikut
  dihitung terlalu mahal dan laba bulan itu terlihat lebih kecil. Pengeluaran
  tetap dicatat dengan harga yang benar-benar dibayar (10 × Rp5.000).
- **Barang rusak, hilang, atau kedaluwarsa mengurangi laba yang dibagi.**
  Dicatat lewat Inventori → Penyesuaian → Kurangi Stok, dinilai dengan harga
  beli saat dicatat. Barang itu sudah dibeli dengan uang gerai; kalau nilainya
  tidak dikurangkan, bagi hasil nasabah lebih besar dari uang yang sebenarnya
  ada. Penyesuaian "Tambah Stok" hanya mengoreksi kerugian bulan yang sama dan
  **tidak pernah menambah laba** — barang kiriman supplier dicatat lewat Barang
  Masuk.
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

### Perubahan nasabah berlaku mulai bulan berikutnya

Keputusan pengurus (September 2026). Sistem menyimpan riwayat modal setiap
nasabah per bulan:

| Yang terjadi hari ini | Bulan ini | Mulai bulan depan |
|---|---|---|
| Nasabah baru bergabung | belum ikut dibagi | ikut dibagi |
| Nasabah menambah / mengurangi modal | modal lama | modal baru |
| Nasabah berhenti | **masih** mendapat bagian | tidak lagi |

Alasannya: modal yang masuk tanggal 20 belum bekerja sebulan penuh; modal yang
keluar tanggal 20 sudah bekerja hampir sebulan. Halaman Nasabah menunjukkan
perubahan yang menunggu, misalnya *"Mulai dihitung Oktober 2026"*.

Dua pengecualian yang berlaku **langsung**, termasuk untuk bulan yang belum
ditutup:

- **Koreksi salah ketik** — di form Edit, pilih "Koreksi salah ketik" bila angka
  modal sebelumnya memang keliru dimasukkan.
- **Salah input / data contoh** — di tombol hapus. Orangnya dihapus dari semua
  bulan yang belum ditutup. Hanya bisa bila ia belum pernah tercatat menerima
  bagian; nasabah sungguhan yang keluar memakai "Berhenti".

### Persentase terkunci sampai bulan lalu ditutup

Persentase nasabah/pengelola di Pengaturan tidak punya riwayat per bulan, jadi
selama distribusi bulan lalu belum ditutup sistem **menolak** mengubahnya.
Bulan lalu yang tidak punya satu pun penjualan tidak mengunci apa-apa.

### Membuka kembali periode

Hanya **master** yang bisa, dan **wajib menulis alasan** (minimal 10 huruf).

Rekamannya tidak hilang: isinya utuh — termasuk bagian setiap nasabah yang
mungkin sudah dibayarkan — disalin ke arsip bersama siapa yang membuka, kapan,
dan kenapa. Riwayat ini tampil di halaman Distribusi Laba.

Saat ditutup ulang, sistem memakai **daftar nasabah dan persentase dari
penutupan pertama**, bukan daftar hari ini. Membuka kembali gunanya mengoreksi
transaksi, bukan mengganti siapa yang menerima bagian.

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

## 4. Dasar bagi hasil: laba kotor

Keputusan pengurus (September 2026): bagi hasil nasabah dihitung dari **laba
yang dibagi** (penjualan − harga pokok − barang rusak), **bukan** dari laba
bersih setelah biaya operasional. Listrik, gaji, sewa, dan biaya lain ditanggung
dari bagian pengelola. Dengan begitu nasabah bisa memeriksa angkanya tanpa perlu
memeriksa setiap nota pengeluaran.

---

## 4a. Bulan rugi — keputusan yang perlu pengurus sepakati

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

Barang yang **masih punya stok tidak bisa dihapus**. Kurangi dulu stoknya lewat
Penyesuaian (rusak, hilang, atau dikembalikan ke supplier) supaya kepergian
barang itu tercatat, lalu hapus.

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

### Retur pembeli

**Menu: Keuangan → Penjualan → tombol ↶ pada barisnya** (admin & master)

Pembeli mengembalikan sebagian barang — misalnya beli 5, kembalikan 2 karena
kemasannya bocor. Berbeda dengan pembatalan, transaksinya tetap sah; yang
dicatat adalah returnya.

- **Uang kembali mengikuti diskon.** Transaksi dengan diskon member 5% hanya
  mengembalikan 95% harga barang, karena memang itu yang dibayar. Total seluruh
  retur satu transaksi tidak pernah melebihi yang dibayar pembeli.
- **Barang utuh** kembali ke stok. Laba berkurang sebesar uang kembali dikurangi
  harga pokoknya (margin yang batal didapat).
- **Barang rusak** (centang di dialog) tidak kembali ke stok. Laba berkurang
  sebesar seluruh uang kembaliannya, karena barangnya ikut hilang.
- **Poin member** ditarik sebanding uang yang dikembalikan.
- **Dihitung pada bulan retur terjadi**, bukan bulan penjualannya. Retur
  tanggal 3 Oktober atas belanja 28 September mengurangi laba Oktober; distribusi
  September yang sudah ditutup tidak berubah dan tidak perlu dibuka kembali.
- Transaksi yang sudah pernah diretur **tidak bisa dibatalkan** (stok dan uang
  akan kembali dua kali) — retur sisa barangnya saja.

---

## 7. Rekap kas shift

Selisih kas dihitung **hanya dari penjualan tunai**:

```
Saldo seharusnya = Saldo awal + Penjualan tunai − Uang retur tunai
Selisih = Saldo akhir (dihitung manual) − Saldo seharusnya
```

Uang retur pembeli yang dikembalikan tunai diambil dari laci shift yang sedang
buka saat retur dicatat.

Halaman Kasir menampilkan peringatan bila **belum ada shift yang dibuka**.
Penjualan tetap bisa dicatat — gerai tidak boleh berhenti melayani — tetapi
uang tunainya tidak masuk rekap laci siapa pun sampai shift dibuka.

Pembayaran transfer, QRIS, dan debit ditampilkan terpisah karena uangnya tidak
pernah masuk ke laci. Sebelum perbaikan ini, semua pembayaran dihitung sebagai
uang laci, sehingga setiap shift dengan pembayaran non-tunai tampak kekurangan
uang — dan kasirnya yang dicurigai.

**Angka ini dibekukan saat shift ditutup.** Kalau sebuah transaksi dibatalkan
keesokan harinya, shift yang sudah ditutup tetap menunjukkan selisih yang
dilihat dan ditandatangani kasirnya malam itu — bukan tiba-tiba "kelebihan"
uang. (Shift yang ditutup sebelum September 2026 belum punya angka beku dan
masih dihitung ulang dari transaksinya.)

Rekap kas "Penjualan Tunai" pada saat shift ditutup juga menampilkan jumlah
transaksi semua metode, supaya kasir tidak bingung kenapa angkanya lebih kecil
dari total penjualan.

---

## 8. Transaksi ganda

Kasir bekerja dari HP atau tablet di jaringan yang tidak selalu stabil. Kalau
koneksi terputus tepat setelah tombol Bayar ditekan, aplikasi tidak bisa tahu
apakah transaksinya sudah masuk atau belum.

Sekarang aman: **tekan Bayar lagi.** Setiap keranjang membawa penanda unik, dan
server mengenali percobaan kedua sebagai transaksi yang sama. Struk yang keluar
adalah struk transaksi yang pertama, bukan transaksi baru.

Penanda itu **diganti begitu isi keranjang berubah** — barang, jumlah, member,
atau metode bayar. Kalau server tetap menerima penanda lama dengan isi yang
berbeda, ia menolak dengan pesan yang menyebut nomor transaksi yang sudah
tercatat, alih-alih diam-diam mengembalikan struk lama seolah-olah transaksi
baru berhasil. Kasir lalu memeriksa Riwayat Penjualan sebelum melanjutkan.
Keranjang juga dikosongkan saat keluar akun, supaya kasir berikutnya tidak
mewarisi keranjang orang lain.

---

## 9. Ekspor data

**Menu: Sistem → Ekspor Data**

Pilih bulannya, lalu unduh. Berkas JSON berisi data induk lengkap ditambah
transaksi bulan itu, termasuk rekaman distribusi bagi hasil. Password pengguna
tidak pernah disertakan.

**Seberapa jauh database bisa dipulihkan tergantung paket penyedianya.** Neon
paket gratis hanya menyimpan riwayat **6 jam**: kalau data terhapus pagi hari
dan baru ketahuan sore, masih bisa dipulihkan; kalau baru ketahuan besok, tidak.
Paket berbayar menyimpan riwayat lebih lama.

Selama masih memakai paket gratis, berkas ekspor inilah satu-satunya salinan
yang lebih tua dari 6 jam. Tentukan satu orang dan satu hari (misalnya setiap
Sabtu) untuk mengunduhnya, dan simpan di luar komputer kasir.

Ekspor "Seluruh data" akan ditolak kalau ukurannya melewati batas; pesannya
akan memberi tahu untuk mengekspor per bulan saja.

---

## 10. Kalau tidak ada yang bisa masuk

Master lupa passwordnya, atau akun awal terlanjur dibuat tanpa password yang
tercatat. Tanpa alat ini satu-satunya jalan keluar adalah mengutak-atik
database secara manual.

```bash
read -s -p "Password baru: " P && echo && printf 'admin
%s
' "$P" | DATABASE_URL="<connection-string>" node scripts/reset-password.mjs
```

Password diketik langsung di terminal, tidak tampil di layar, dan tidak masuk
riwayat perintah shell. Ganti `admin` dengan username lain bila perlu.

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
- [ ] Batas pemulihan database diketahui (Neon gratis: 6 jam). Selama masih
      paket gratis, ada jadwal tetap mengunduh Ekspor Data.
- [ ] Rasio bagi hasil di Pengaturan diperiksa (bawaan 30% nasabah /
      70% pengelola)
- [ ] Daftar nasabah dan jumlah investasinya diperiksa sebelum periode pertama
      ditutup
- [ ] Migrasi database berjalan otomatis saat build **produksi** di Vercel
      lewat skrip `vercel-build`. Build preview sengaja TIDAK memigrasi:
      `DATABASE_URL` preview dan produksi menunjuk database yang sama, jadi
      tanpa penjaga itu sebuah pull request bisa mengubah skema produksi
      sebelum di-merge. Kalau deploy di tempat lain, jalankan
      `npm run db:migrate` sendiri sebelum aplikasi dipakai.
- [ ] Kalau memakai connection pooling (Neon pooled / Supabase port 6543),
      tambahkan `directUrl` pada `prisma/schema.prisma` — tanpa itu
      `prisma migrate deploy` akan gagal terhadap PgBouncer. Sengaja belum
      ditambahkan karena bergantung pada cara database Anda dibuat.

---

## 12. Catatan keamanan yang sudah diputuskan

### Mengganti password mengeluarkan perangkat lain

Kalau HP kasir hilang atau ada yang curiga akunnya dipakai orang lain, ganti
passwordnya — dari **Akun Saya**, atau oleh master dari halaman **Pengguna**.
Semua perangkat lain yang sedang login dengan akun itu langsung keluar;
perangkat yang dipakai untuk mengganti tetap masuk. Sebelumnya perangkat lain
tetap bisa dipakai sampai 12 jam kemudian. Uji: `node scripts/uji-sesi.mjs`.

Menonaktifkan akun di halaman Pengguna juga langsung mengeluarkannya dari semua
perangkat.

### Yang sengaja tidak dikerjakan

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
npm test                          # 75 uji perhitungan, periode WIB, sesi, hak akses, modal, retur, struk thermal
bash scripts/smoke-test.sh        # 76 uji hak akses, pencabutan sesi, bypass middleware, header
node scripts/uji-distribusi.mjs   # 22 uji rekaman bagi hasil
node scripts/uji-idempotensi.mjs  # 17 uji transaksi ganda & stok
node scripts/uji-pembatalan.mjs   # 32 uji pembatalan penjualan
node scripts/uji-penguncian.mjs   # 36 uji kunci persentase, arsip, shift beku
node scripts/uji-barang.mjs       # 37 uji edit & hapus barang, harga rata-rata, kerugian stok
node scripts/uji-sesi.mjs         # 19 uji pencabutan sesi
node scripts/uji-nasabah.mjs      # 23 uji modal nasabah per bulan
node scripts/uji-retur.mjs        # 27 uji retur pembeli
```

Totalnya 364 pemeriksaan otomatis. Sebelum perbaikan September 2026 hanya ada
56, dan semuanya tentang hak akses — tidak satu pun menyentuh perhitungan uang.

Skrip `uji-*` butuh server berjalan (`npm run build && npm start`) dan
**menulis ke database** — jalankan hanya terhadap database uji, tidak pernah
terhadap produksi.
