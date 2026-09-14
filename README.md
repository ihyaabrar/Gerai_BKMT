<div align="center">

<img src="public/images/masjid.webp" alt="Gerai BKMT" width="240" />

# 🕌 Gerai BKMT

**Sistem kasir, inventori, bagi hasil, dan profil publik**
untuk **PD BKMT Kabupaten Kubu Raya**

[![Next.js](https://img.shields.io/badge/Next.js-14.2-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech)

[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Vercel](https://img.shields.io/badge/Vercel-sin1-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
[![Uji](https://img.shields.io/badge/uji-179%20pemeriksaan-1E7A4D?style=for-the-badge)](#-pengujian)
[![Lisensi](https://img.shields.io/badge/lisensi-MIT-F5C518?style=for-the-badge)](./LICENSE)

</div>

---

## 📖 Tentang

PD BKMT Kubu Raya adalah organisasi kemasyarakatan Islam dengan sekitar **20 cabang** dan **130 majelis taklim**. Aplikasi ini melayani dua hal sekaligus dari satu basis kode:

🏪 **Gerai BKMT** — toko kecil yang dijalankan 1–3 kasir relawan, sering dari tablet atau HP.
🌐 **Website organisasi** — profil, berita, pengurus, galeri, dan agenda kegiatan.

> **Yang membuat aplikasi ini tidak biasa:** modal gerai berasal dari **nasabah** — anggota yang menanamkan uangnya. Laba bulanan dibagi menurut rasio yang disepakati, lalu bagian nasabah dibagi lagi **pro-rata** sesuai porsi modal masing-masing.
>
> Artinya setiap angka di sini menyangkut uang orang lain, dan harus bisa dipertanggungjawabkan berbulan-bulan kemudian.

---

## ✨ Yang Bisa Dilakukan

<table>
<tr>
<td width="50%" valign="top">

### 💳 Kasir
- Pencarian cepat & pemindai barcode
- Diskon member otomatis
- **Aman dari transaksi ganda** saat koneksi putus
- Cetak struk langsung dari kasir
- Shift buka/tutup dengan rekap kas

</td>
<td width="50%" valign="top">

### 📦 Inventori
- Barang, kategori, stok minimum
- Barang masuk + pencatatan pengeluaran sekaligus
- Penyesuaian stok beralasan
- Retur barang ke supplier
- **Retur pembeli** sebagian, barang utuh atau rusak
- Peringatan stok menipis

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 💰 Keuangan
- **Distribusi laba per periode yang dibekukan**
- Pembatalan penjualan dengan jejak lengkap
- Laporan penjualan & pengeluaran
- Ekspor Excel
- Rekap kas shift (hanya tunai)

</td>
<td width="50%" valign="top">

### 🌐 Publik & Admin
- Profil, visi-misi, sejarah organisasi
- Berita & pengumuman
- Pengurus PD/PC/Permata
- Galeri dokumentasi & agenda
- Informasi & lokasi gerai

</td>
</tr>
</table>

---

## 💡 Sistem Bagi Hasil

```
Laba Kotor = Uang diterima − Harga pokok saat barang terjual
                              └── dibekukan per transaksi, bukan harga hari ini

├── 30% → Nasabah       dibagi pro-rata sesuai porsi modal
└── 70% → Pengelola     ├── Gaji Pegawai ......... 20%
                        ├── Kontribusi Organisasi . 20%
                        ├── Dana Sosial .......... 20%
                        ├── Dana Pengembangan .... 10%
                        └── Operasional & Lainnya  30%
```

Rasio 30/70 dapat diubah di **Pengaturan**.

### 🔒 Kenapa periode harus "ditutup"

| Keadaan | Artinya |
|---|---|
| **Pratinjau** | Angka dihitung ulang tiap dibuka — masih bisa berubah |
| **Ditutup** | Seluruh angka dibekukan: laba, HPP, diskon, rasio, serta **nama, modal, persentase, dan bagian setiap nasabah saat itu** |

Ketika seorang anggota bertanya *"kenapa bagian saya bulan Juli segini?"*, jawabannya dibaca dari rekaman bulan Juli — bukan dihitung ulang dengan daftar nasabah hari ini.

📘 Penjelasan lengkap untuk pengurus: **[`docs/INTEGRITAS_KEUANGAN.md`](./docs/INTEGRITAS_KEUANGAN.md)**

---

## 🛠️ Teknologi

| Lapisan | Pilihan | Alasan |
|---|---|---|
| Framework | Next.js 14 App Router + TypeScript | Server component untuk halaman berat data |
| Database | PostgreSQL (Neon) + Prisma | Transaksi atomik untuk penjualan |
| Styling | Tailwind CSS | Token desain terpusat |
| State | Zustand + persist | Keranjang selamat saat halaman dimuat ulang |
| Auth | Cookie HMAC-SHA256 via Web Crypto | Jalan di Edge middleware **dan** Node runtime |
| Upload | Cloudinary | Ukuran gambar dibatasi lewat URL |
| Uji | Vitest + skrip integrasi | 179 pemeriksaan otomatis |
| Deploy | Vercel, region `sin1` | Singapura — terdekat dari Kalimantan Barat |

---

## 🎨 Palet

| | Warna | Peran |
|---|---|---|
| 🟩 | `brand` `#1E7A4D` → `#072518` | Aksi utama, sidebar, footer |
| 🟨 | `gold` `#F5C518` | Aksen, lambang BKMT |
| ⬜ | `surface` `#FBFDFC` | Latar halaman |
| 🟥 | `rose` | Pembatalan, selisih negatif |

---

## 🚀 Menjalankan di Komputer Sendiri

### 1 — Pasang

```bash
git clone https://github.com/ihyaabrar/Gerai_BKMT.git
cd Gerai_BKMT
npm install
```

### 2 — Environment

```bash
cp .env.example .env
```

| Variabel | Wajib | Keterangan |
|---|:---:|---|
| `DATABASE_URL` | ✅ | PostgreSQL (Neon / Supabase / lokal) |
| `AUTH_SECRET` | ✅ | **Minimal 32 karakter.** `openssl rand -base64 32` |
| `CLOUDINARY_*` | ➖ | Tanpa ini aplikasi tetap jalan, hanya upload foto yang mati |
| `SEED_ADMIN_PASSWORD` | ➖ | Wajib bila database bukan lokal |
| `SEED_KASIR_PASSWORD` | ➖ | Sama |

> ⚠️ Aplikasi **menolak berjalan** tanpa `AUTH_SECRET` di mana pun selain mesin pengembang — termasuk preview Vercel. Itu disengaja.

### 3 — Database

```bash
npm run db:migrate   # jalankan migrasi
npm run db:seed      # isi data awal
```

### 4 — Jalankan

```bash
npm run dev
```

Buka **http://localhost:3000**

<details>
<summary><b>Akun bawaan (pengembangan lokal saja)</b></summary>

<br>

| Role | Username | Password |
|---|---|---|
| Master | `admin` | `admin123` |
| Kasir | `kasir` | `kasir123` |

Seed **menolak** password bawaan bila `DATABASE_URL` bukan localhost, dan **tidak pernah menimpa** password akun yang sudah ada.

Lupa password master? Ada alat pemulihnya:

```bash
read -s -p "Password baru: " P && echo && \
printf 'admin\n%s\n' "$P" | DATABASE_URL="<connection-string>" \
node scripts/reset-password.mjs
```

</details>

---

## ☁️ Deploy ke Vercel

1. **Buat database** — Neon, region **Singapore** (cocok dengan `vercel.json`)
2. **Import repo** di [vercel.com/new](https://vercel.com/new)
3. **Isi environment variables** — `DATABASE_URL`, `AUTH_SECRET`, dan `CLOUDINARY_*`, centang **Production dan Preview**
4. **Deploy** — migrasi berjalan otomatis lewat skrip `vercel-build`
5. **Seed sekali** dari komputer Anda:

```bash
DATABASE_URL="<url-produksi>" SEED_ADMIN_PASSWORD="..." SEED_KASIR_PASSWORD="..." npm run db:seed
```

6. **Pahami batas backup** — Neon paket gratis hanya bisa memulihkan database **6 jam ke belakang**. Kesalahan yang baru ketahuan besok tidak bisa dipulihkan dari sana: unduh **Ekspor Data** tiap akhir pekan, atau pakai paket berbayar yang menyimpan riwayat lebih lama

> 💡 Neon paket gratis menidurkan database saat menganggur. Transaksi pertama setelah toko sepi butuh **±3 detik** untuk membangunkannya. Itu bukan kerusakan.

---

## 🧪 Pengujian

```bash
npm test                          # 63  perhitungan laba, periode WIB, sesi, modal, retur
bash scripts/smoke-test.sh        # 75  hak akses, pencabutan sesi, header keamanan
node scripts/uji-distribusi.mjs   # 22  rekaman bagi hasil kebal perubahan
node scripts/uji-idempotensi.mjs  # 17  transaksi ganda & stok negatif
node scripts/uji-pembatalan.mjs   # 32  pembatalan penjualan
node scripts/uji-penguncian.mjs   # 36  kunci persentase, arsip buka-kembali, shift beku
node scripts/uji-barang.mjs       # 34  edit barang, harga rata-rata, barang rusak
node scripts/uji-sesi.mjs         # 19  ganti password mengeluarkan perangkat lain
node scripts/uji-nasabah.mjs      # 23  modal nasabah berlaku bulan berikutnya
node scripts/uji-retur.mjs        # 27  retur pembeli, uang kembali, kas shift
                                  # ───
                                  # 348 pemeriksaan
```

Skrip `uji-*` butuh server berjalan dan **menulis ke database** — jalankan hanya terhadap database uji.

Uji yang paling penting: setelah sebuah periode ditutup, harga beli dinaikkan dan daftar nasabah diubah — lalu periode itu dibaca ulang. **Seluruh angkanya tidak boleh bergeser satu rupiah pun.**

---

## 🔐 Keamanan

| | |
|---|---|
| 🔑 | Password di-hash **bcrypt cost 12**. Password tersimpan yang bukan hash bcrypt ditolak, bukan diterima |
| 🍪 | Cookie sesi **HMAC-SHA256**, berlaku 12 jam |
| 🚫 | Menonaktifkan pengguna **langsung** mencabut akses — role dibaca dari database, bukan cookie |
| 🛡️ | Seluruh route non-publik dijaga `src/middleware.ts` **dan** tiap route handler |
| 💵 | Harga, diskon, dan total **dihitung ulang di server** — angka dari browser tidak pernah dipercaya |
| ⏱️ | Waktu respons login diseragamkan agar username terdaftar tidak bisa ditebak |
| 📋 | Penjualan, pengeluaran, penyesuaian stok, dan retur mencatat **siapa pembuatnya** |
| 🔢 | Kesalahan tak terduga diberi **kode 6 karakter** yang muncul di layar dan di log |

---

## 👥 Hak Akses

| Tindakan | Kasir | Admin | Master |
|---|:---:|:---:|:---:|
| Melayani penjualan | ✅ | ✅ | ✅ |
| Barang masuk & penyesuaian stok | ✅ | ✅ | ✅ |
| Daftarkan barang baru / ubah harga | ❌ | ✅ | ✅ |
| Lihat angka laba & laporan | ❌ | ✅ | ✅ |
| Batalkan penjualan | ❌ | ✅ | ✅ |
| Tutup distribusi laba | ❌ | ✅ | ✅ |
| Buka kembali distribusi | ❌ | ❌ | ✅ |
| Kelola pengguna | ❌ | ❌ | ✅ |

Kasir tidak menyentuh harga karena harga beli menentukan laba, dan laba menentukan bagi hasil nasabah.

---

## 📂 Peta Kode

```
prisma/
  schema.prisma          skema database
  migrations/            riwayat migrasi
  seed.ts                data awal
src/
  app/
    page.tsx             beranda publik
    login/  berita/      halaman publik
    app/                 sistem kasir      (butuh login)
    admin/               panel konten      (master/admin)
    api/                 route handler
  components/
    layout/  public/  ui/
  lib/
    keuangan.ts          ⭐ satu-satunya sumber perhitungan laba
    session.ts           tanda tangan & verifikasi cookie
    permissions.ts       peta hak akses per role
    identitas.ts         nama, singkatan, logo organisasi
    gambar.ts            pembatas ukuran gambar Cloudinary
    validate.ts          validasi body request
  store/                 auth & keranjang (Zustand)
  middleware.ts          penjaga route di sisi server
scripts/
  smoke-test.sh          uji hak akses
  uji-*.mjs              uji integrasi
  reset-password.mjs     pemulihan password
docs/
  INTEGRITAS_KEUANGAN.md panduan untuk pengurus
```

---

## 📜 Perintah

| Perintah | Kegunaan |
|---|---|
| `npm run dev` | Server pengembangan |
| `npm run build` | Build produksi |
| `npm test` | Uji unit |
| `npm run db:migrate` | Terapkan migrasi |
| `npm run db:seed` | Isi data awal |
| `npm run db:studio` | GUI database |

---

<div align="center">

**Dikembangkan untuk PD BKMT Kabupaten Kubu Raya**

*Bersama Umat, Membangun Masyarakat*

[![Lisensi MIT](https://img.shields.io/badge/Lisensi-MIT-F5C518?style=flat-square)](./LICENSE)
![Versi](https://img.shields.io/badge/versi-3.4.0-1E7A4D?style=flat-square)
![Diperbarui](https://img.shields.io/badge/diperbarui-September%202026-8DCFAA?style=flat-square)

</div>
