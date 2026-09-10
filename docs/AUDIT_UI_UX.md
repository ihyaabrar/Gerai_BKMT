# Audit & Perbaikan UI/UX

Audit dilakukan dengan menjalankan aplikasi dan memeriksa DOM secara langsung,
bukan membaca kode saja. Dokumen ini mencatat temuan beserta perbaikannya.

---

## 🔴 Dua fitur mati total

**Tambah Supplier** dan **Tambah Pengeluaran** tidak punya tombol sama sekali.
Di halaman Supplier hanya ada tombol ikon edit/hapus; di Pengeluaran hanya
"Export Excel".

Penyebabnya sama: `DialogTrigger` diletakkan **di dalam** `<Dialog>`, sedangkan
komponen `Dialog` melakukan `if (!open) return null`. Saat dialog tertutup,
tombol pemicunya ikut tidak dirender — dan karena itu tidak akan pernah bisa
dibuka.

```tsx
<Dialog open={open} …>        {/* open=false → return null */}
  <DialogTrigger asChild>     {/* ikut hilang */}
    <Button>Tambah Supplier</Button>
```

Ini pola Radix, tapi `dialog.tsx` di proyek ini komponen buatan sendiri yang
tidak mendukungnya. Halaman Member memakai tombol biasa + state, sehingga
berfungsi normal — itulah kenapa masalahnya tidak pernah terlihat.

Bug ini ada sejak commit pertama (`88eac66`).

**Perbaikan:** `Dialog` kini memisahkan `DialogTrigger` dari isi dialog.
Trigger selalu dirender dan otomatis menerima `onClick`; hanya overlay dan
kontennya yang bergantung pada `open`. Perbaikan di komponen dasar, jadi
semua pemakaian sekarang dan nanti ikut benar.

---

## 🟠 Konsistensi

### Warna tombol aksi berbeda di hampir setiap halaman

Terukur, bukan selera:

| Halaman | Warna tombol utama (sebelum) |
|---|---|
| Penyesuaian, Stok, Backup | `emerald-600` |
| Penjualan, Pengeluaran, Shift | `green-600` |
| Supplier, Retur | `orange-600` |
| Pengaturan, Distribusi | `blue-600` |
| Barang Masuk | gradient `blue-600 → indigo-600` |

`green` dan `emerald` adalah dua palet Tailwind berbeda yang dipakai
bergantian untuk peran yang sama — jenis inkonsistensi paling licin karena
kelihatan *hampir* benar.

**Perbaikan:** peran warna dibakukan.

| Peran | Warna |
|---|---|
| Aksi utama halaman | emerald (varian default `Button`) |
| Aksi merusak (hapus) | merah |
| Area admin | violet, mengikuti sidebar admin |
| Aksi sekunder (Export, Print) | `variant="outline"` |

Sebagian besar tombol kini tidak lagi menimpa warna sama sekali dan cukup
memakai varian default, sehingga tidak bisa melenceng lagi di kemudian hari.

### Data master disajikan dengan tiga pola berbeda

Member dan Nasabah memakai tabel, Supplier memakai grid kartu — jenis data
yang setara dengan model mental yang berbeda.

**Perbaikan:** Supplier ikut memakai tabel, termasuk gaya empty state yang
sama.

### Nama organisasi tercetak dua kali di halaman publik

Hero menampilkan "PD BKMT Kubu Raya" lalu baris kedua "Kubu Raya", karena
`"Kubu Raya"` di-hardcode sementara `singkatan` dari database sudah memuat
nama lengkapnya. Admin punya panel CMS tapi tidak bisa memperbaikinya.

**Perbaikan:** judul sepenuhnya diambil dari data profil; kata terakhir
diberi warna aksen agar penekanan visualnya tetap ada.

---

## 🟡 Aksesibilitas

### Label tidak terhubung ke kolomnya

Pemeriksaan awal: **0 dari 9 input** punya `id`, dan **tidak ada** label yang
punya `for`. Mengeklik label tidak memfokuskan kolom, dan pembaca layar tidak
bisa mengumumkan nama kolom. Polanya (`<label>` + `<Input>` bersebelahan tanpa
kaitan) tersebar di 18 berkas.

**Perbaikan:** 51 pasang label–input dihubungkan lewat `htmlFor`/`id`.
Kasus yang tersisa ditangani sesuai bentuknya:

- Grup tombol (Metode Bayar, Jenis Penyesuaian) → `role="group"` +
  `aria-labelledby`, karena isinya bukan satu kolom input
- Keterangan widget unggah gambar → `<p>`, karena `ImageUpload` sudah punya
  label internal sendiri
- Kotak pencarian dan input tanpa label terlihat → `aria-label`

Hasil akhir: seluruh halaman yang diperiksa melaporkan **input bernama
lengkap** dan **0 label lepas**.

### Tombol ikon tanpa nama

Halaman Pengaturan punya 14 tombol ikon tanpa nama, Member 8 — semuanya tidak
terbaca pembaca layar.

**Perbaikan:** semua tombol ikon diberi `aria-label` yang menyebut entitasnya,
misalnya `Hapus kategori Makanan` atau `Tambah jumlah Kopi Susu`, bukan
sekadar "Hapus".

### Harus menekan Tab 12 kali untuk sampai ke konten

Tidak ada link "lewati ke konten", sehingga pengguna keyboard menyusuri
seluruh sidebar di setiap halaman.

**Perbaikan:** link lewati ditambahkan sebagai elemen fokusable pertama
(tersembunyi sampai difokuskan), menuju `<main id="konten-utama">`.

### Ring fokus memakai warna bawaan Tailwind

`Button` memakai `focus-visible:ring-2` tanpa menyetel warna, sehingga ring
fokusnya biru di atas tombol emerald.

**Perbaikan:** `focus-visible:ring-emerald-500` beserta ring offset.

---

## 🟢 Kenyamanan

### `confirm()` bawaan browser di 8 tempat

Termasuk untuk penghapusan permanen. Memblokir seluruh tab, tidak bisa
di-style, dan tampilannya berbeda di tiap peramban.

**Perbaikan:** komponen `ConfirmDialog` + hook `useConfirm`. Pesannya kini
menyebut entitas dan konsekuensinya:

> **Hapus nasabah?**
> **Hj. Fatimah** akan dinonaktifkan dan porsi bagi hasil seluruh nasabah
> dihitung ulang.

Tombolnya juga terkunci selama proses berjalan sehingga tidak bisa ditekan
dua kali.

### "Loading..." teks polos di 13 tempat

Tata letak melompat saat data datang.

**Perbaikan:** komponen skeleton (`TableSkeleton`, `PageSkeleton`,
`StatsSkeleton`) yang bentuknya sudah menyerupai konten akhir, lengkap dengan
`role="status"` supaya pembaca layar tahu ada proses berjalan.

### Form Pengaturan hanya memakai 47% lebar layar

Lebarnya 672px di layar 1440px, dan ketiga kartu bertumpuk vertikal sehingga
pengguna harus scroll panjang.

**Perbaikan:** tata letak dua kolom di layar `xl`, tetap satu kolom di layar
sempit.

### Section Berita rusak bila isinya sedikit

Selalu memakai grid 5 kolom (3 untuk berita utama + 2 untuk sidebar), sehingga
dengan satu berita kolom kanan kosong melompong. Link "Lihat semua" juga
mengarah ke `#berita` — section dirinya sendiri.

**Perbaikan:** tata letak menyesuaikan jumlah berita, dan link hanya muncul
bila memang ada lebih dari satu berita.

---

## Verifikasi

| Ukuran | Hasil |
|---|---|
| 375×812 (HP) | Tidak ada scroll horizontal; dialog tampil sebagai sheet |
| 768×1024 (tablet) | Grid produk 3 kolom, drawer navigasi |
| 1440×900 (desktop) | Dua kolom pada Pengaturan, sidebar tetap |

- 21 halaman aplikasi dimuat tanpa error
- Halaman yang diperiksa: input bernama lengkap, 0 label lepas,
  0 tombol ikon tanpa nama, 0 tabel di luar wadah scroll
- 42 uji kontrol akses (`scripts/smoke-test.sh`) tetap lulus
- `tsc --noEmit` dan `next build` bersih

## Yang belum dikerjakan

Bukan bug, tapi celah fungsi yang masih terbuka:

- **Manajemen pengguna** — belum ada halaman maupun API untuk menambah kasir
  atau mengganti password. Akun hanya bisa dibuat lewat seed database.
- **Cetak ulang struk** dari riwayat penjualan
- **Pembatalan (void) transaksi** dengan pengembalian stok
- **Pintasan papan ketik** di kasir (F2 cari, F4 bayar)
