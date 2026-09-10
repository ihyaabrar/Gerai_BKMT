# Perbaikan September 2026

Ringkasan perubahan pada audit keamanan & integritas data.

---

## 🔴 Keamanan

### 1. Cookie sesi bisa dipalsukan siapa saja

Cookie `session` berisi JSON polos:

```
session={"id":"...","role":"master","nama":"..."}
```

Siapa pun bisa mengetiknya sendiri di devtools dan langsung menjadi master.

**Perbaikan:** cookie sekarang ditandatangani HMAC-SHA256 (`src/lib/session.ts`)
dengan `AUTH_SECRET`, berisi masa berlaku 12 jam, dan diverifikasi di setiap
request. Implementasi memakai Web Crypto agar berfungsi di Node runtime maupun
Edge runtime (middleware).

### 2. Seluruh API bisnis terbuka tanpa login

14 endpoint — `/api/barang`, `/api/penjualan`, `/api/laporan`, `/api/backup`,
`/api/pengaturan`, dan lainnya — tidak punya pemeriksaan autentikasi sama sekali.
Siapa pun yang tahu URL-nya bisa membaca seluruh data penjualan atau mengubah
stok dan harga.

**Perbaikan:**
- `src/middleware.ts` menjaga semua route non-publik di sisi server
- Setiap route handler tetap memanggil `requireAuth` / `requireAdminAuth`
  sebagai lapis kedua
- Peta hak akses per role terpusat di `src/lib/permissions.ts`

### 3. Proteksi halaman hanya di browser

`AuthProvider` memutuskan akses dari state Zustand di `localStorage`, yang
bisa disunting bebas oleh pengguna.

**Perbaikan:** middleware server melakukan redirect, dan `AuthProvider` kini
memverifikasi sesi ke `/api/auth/me` setiap kali route berpindah.

### 4. Lain-lain

- Rate limit login: 10 percobaan gagal per username per 15 menit
- Kredensial demo di halaman login hanya tampil di luar mode produksi
- Parameter `?next=` pada login divalidasi agar tidak bisa dipakai open redirect
- Backup tidak lagi menyertakan hash password

---

## 🟠 Integritas data

### 5. Harga penjualan dipercaya dari browser

`POST /api/penjualan` memakai `hargaJual`, `subtotal`, `diskon` dan `total`
kiriman client. Dengan satu request manual, barang seharga Rp 18.000 bisa
"dibeli" seharga Rp 1.

**Perbaikan:** server membaca harga dari database, menghitung ulang subtotal,
diskon (dari `Pengaturan.diskonMember`) dan total. Angka dari client hanya
dipakai untuk tampilan.

### 6. Penjualan dan pengurangan stok tidak atomik

Penjualan dibuat lebih dulu, lalu stok dikurangi dalam perulangan terpisah.
Kegagalan di tengah meninggalkan penjualan tanpa potong stok, dan dua kasir
yang bertransaksi bersamaan bisa membuat stok minus.

**Perbaikan:** seluruh proses (validasi stok, pembuatan penjualan, pengurangan
stok, penambahan poin member) berjalan dalam satu `prisma.$transaction`.
Hal yang sama diterapkan pada penyesuaian stok, retur, dan data nasabah.

### 7. Barang masuk memakai angka stok basi

Halaman barang masuk mengirim `stok: stokLama + qty` berdasarkan angka yang
sudah dimuat di browser, lalu memanggil `/api/pengeluaran` terpisah. Transaksi
kasir yang terjadi di sela-sela itu tertimpa, dan bila langkah kedua gagal
stok bertambah tanpa catatan pengeluaran.

**Perbaikan:** endpoint baru `POST /api/barang-masuk` melakukan `increment`
stok dan pencatatan pengeluaran dalam satu transaksi.

### 8. Total penjualan per shift selalu Rp 0

`Penjualan.shiftId` tidak pernah diisi, sehingga rekap tutup shift selalu
menghitung Rp 0 dan selisih kas selalu salah.

**Perbaikan:** penjualan otomatis terhubung ke shift yang sedang aktif.
Rekap tutup shift kini menampilkan total penjualan, jumlah transaksi,
saldo seharusnya, dan selisih kas.

### 9. `userId` shift dari client

Shift dibuat dengan `userId` kiriman browser (sebelumnya bahkan hardcoded
`"default-user-id"`), sehingga siapa pemilik shift tidak bisa dipercaya.

**Perbaikan:** `userId` diambil dari sesi login di server.

### 10. Catatan tutup shift hilang diam-diam

Form tutup shift mengumpulkan `catatan`, tapi kolomnya tidak pernah ada di
skema database. Isian kasir dibuang tanpa peringatan.

**Perbaikan:** kolom `catatan` ditambahkan
(migrasi `20260910000000_add_shift_catatan`) dan kini tersimpan.

### 11. Mass assignment pada endpoint tulis

`prisma.barang.create({ data: body })` dan pola serupa membuat client bebas
mengisi kolom apa pun.

**Perbaikan:** `src/lib/validate.ts` — setiap endpoint kini mem-parsing field
secara eksplisit dengan batas panjang, rentang angka, dan enum yang jelas.

### 12. Diskon: rupiah vs persen tertukar

`Penjualan.diskon` disimpan sebagai nilai rupiah, tetapi halaman riwayat
penjualan dan struk menampilkannya sebagai persen lalu membaginya 100 lagi.

**Perbaikan:** keduanya kini menampilkan nilai rupiah, dengan persentase
dihitung dari subtotal hanya untuk label.

---

## 🟡 Fungsional & performa

### 13. Backup masih menyalin file SQLite

`/api/backup` menyalin `prisma/dev.db` — sisa dari masa SQLite. Database sudah
PostgreSQL dan Vercel tidak punya filesystem persisten, jadi fitur ini tidak
pernah bisa berhasil.

**Perbaikan:** backup kini mengekspor seluruh tabel sebagai satu file JSON yang
langsung diunduh browser. Halaman backup menampilkan jumlah baris per tabel.

### 14. Dashboard menjalankan 12 query berurutan

Grafik 12 bulan memanggil database sekali per bulan di dalam perulangan.

**Perbaikan:** satu query untuk seluruh rentang, dikelompokkan di memori.
Query lain dijalankan paralel dengan `Promise.all`.

### 15. Riwayat penjualan memuat seluruh tabel

Halaman riwayat mengambil semua transaksi lalu memotongnya di browser.

**Perbaikan:** paginasi dan pencarian dikerjakan server, dengan input
pencarian yang di-debounce.

### 16. Kode member duplikat

Kode member berikutnya dihitung dari elemen terakhir daftar yang **diurutkan
berdasarkan nama**, bukan berdasarkan kode.

**Perbaikan:** kode dibuat server dari kode tertinggi yang ada.

### 17. Script seed gagal di Windows

`ts-node --compiler-options {"module":"CommonJS"}` rusak karena tanda kutip
dihapus shell.

**Perbaikan:** memakai `prisma/tsconfig.seed.json` sehingga bebas masalah
kutip di semua shell.

### 18. Halaman rusak saat API menolak akses

Banyak halaman memanggil `await res.json()` lalu `.map()` tanpa memeriksa
`res.ok`. Ketika API membalas `{ "error": ... }`, halaman langsung crash.

**Perbaikan:** semua pengambilan daftar memeriksa status dan bentuk data,
lalu menampilkan toast. Pesan error spesifik dari server kini ditampilkan
ke pengguna, bukan diganti pesan generik.

### 19. Lain-lain

- Tombol submit dinonaktifkan selama proses simpan (mencegah data ganda)
- Validasi rentang tanggal pada laporan
- Persentase bagi hasil nasabah + pengelola divalidasi harus 100%
- `tsconfig.tsbuildinfo` dikeluarkan dari git
