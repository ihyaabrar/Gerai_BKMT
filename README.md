# 🕌 Gerai BKMT — Sistem POS, Inventory & Profil Publik

Aplikasi terintegrasi untuk **PD BKMT Kabupaten Kubu Raya** yang menggabungkan:
- **Halaman Profil Publik** — wajah digital organisasi BKMT yang dapat diakses siapa saja
- **Sistem POS & Inventory** — kasir digital untuk Gerai BKMT
- **Admin Panel** — pengelolaan konten profil publik

---

## 🚀 Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL (Neon) + Prisma ORM |
| State | Zustand (persist) |
| Upload | Cloudinary |
| Auth | Cookie sesi bertanda tangan HMAC-SHA256 (HTTP-only) + Next.js middleware |
| Deploy | Vercel |
| Notifikasi | Sonner |
| Export | SheetJS (xlsx) |
| Barcode | html5-qrcode |

---

## 📱 Struktur Aplikasi

```
/                   → Halaman profil publik BKMT (bebas akses)
/berita/[slug]      → Detail berita publik
/login              → Halaman login
/app                → Dashboard sistem kasir (butuh login)
/app/kasir          → POS kasir
/app/inventori/*    → Manajemen inventori
/app/keuangan/*     → Laporan keuangan & distribusi laba
/app/master/*       → Data master (member, nasabah, supplier)
/app/sistem/*       → Pengaturan sistem
/admin              → Admin panel konten (master/admin only)
/admin/profil       → Edit profil organisasi
/admin/berita       → CRUD berita & pengumuman
/admin/pengurus     → CRUD pengurus (PD/PC/Permata)
/admin/gerai        → Edit informasi gerai
```

---

## ✨ Fitur Utama

### 🌐 Halaman Profil Publik
- Hero section dengan gradient hijau + statistik organisasi
- Profil organisasi: visi, misi, sejarah
- Berita & pengumuman (featured + sidebar layout)
- Susunan pengurus (PD, PC, Permata BKMT)
- Informasi gerai dengan CTA login kasir
- Responsive mobile & desktop
- SEO-friendly (Server Components)

### 🛡️ Admin Panel
- Dashboard dengan progress kelengkapan konten
- Edit profil organisasi (nama, visi, misi, sejarah, kontak, sosmed)
- CRUD berita dengan auto-slug generation
- CRUD pengurus dengan upload foto (Cloudinary)
- Edit informasi gerai
- Upload gambar langsung dari komputer (JPG/PNG/WebP, maks 5MB)

### 📱 Responsif
- Sidebar berubah jadi drawer di bawah 1024px — bisa dipakai dari HP & tablet
- Dialog tampil sebagai sheet yang bisa di-scroll di layar kecil
- Bar pembayaran melayang di halaman kasir versi mobile
- Semua tabel bisa digeser horizontal tanpa merusak lebar halaman

### 💳 Sistem Kasir (POS)
- Product grid responsif (2/3/4 kolom) dengan search & barcode scanner
- Shopping cart dengan validasi stok real-time
- Member selection dengan diskon otomatis
- Multiple payment methods (Tunai/Transfer/QRIS)
- Print struk thermal 58mm
- Poin member otomatis (1 poin/Rp1.000)

### 📦 Inventory Management
- Barang masuk dengan pencatatan pengeluaran otomatis
- Monitoring stok real-time dengan alert stok minimum
- Penyesuaian stok (stock opname)
- Retur barang (stok dikurangi saat status selesai)
- Kategori barang dari database (bisa tambah di Pengaturan)

### 💰 Keuangan
- Riwayat penjualan dengan export Excel
- Pengeluaran operasional dengan kategori dari database
- Distribusi laba otomatis (nasabah + pengelola)
- Laporan penjualan dengan grafik & produk terlaris
- Persentase nasabah auto-rebalance saat tambah/edit/hapus

### 👥 Master Data
- Member dengan sistem poin
- Nasabah/investor dengan perhitungan bagi hasil
- Supplier

### ⚙️ Sistem
- Shift kasir dengan rekap saldo
- Pengaturan toko (nama, prefix transaksi, diskon member, persentase bagi hasil)
- Manajemen kategori barang & pengeluaran
- Backup database (SQLite)

---

## 🗄️ Database Schema

**16 tabel:**

| Model | Deskripsi |
|-------|-----------|
| User | Pengguna sistem (master/kasir) |
| Barang | Produk/barang dagangan |
| Member | Pelanggan setia dengan poin |
| Nasabah | Investor dengan bagi hasil |
| Supplier | Pemasok barang |
| Penjualan | Transaksi penjualan |
| DetailPenjualan | Item per transaksi |
| Pengeluaran | Pengeluaran operasional |
| ShiftKasir | Shift kasir |
| PenyesuaianStok | Stock opname |
| Retur | Pengembalian barang |
| Pengaturan | Konfigurasi sistem |
| KategoriBarang | Kategori produk (dinamis) |
| KategoriPengeluaran | Kategori pengeluaran (dinamis) |
| ProfilOrganisasi | Profil publik BKMT |
| Berita | Artikel & pengumuman |
| Pengurus | Susunan pengurus (PD/PC/Permata) |
| InformasiGerai | Info operasional gerai |

---

## 🔐 Role & Akses

| Role | Akses |
|------|-------|
| `master` | Semua fitur + admin panel |
| `admin` | Semua fitur + admin panel |
| `kasir` | POS, inventori, pengeluaran, master member/supplier |

Kasir **tidak** dapat mengakses: admin panel, laporan keuangan, distribusi laba,
data nasabah, pengaturan sistem, dan backup. Pembatasan ini ditegakkan di
`src/middleware.ts` (server), bukan hanya disembunyikan di UI.

---

## 📦 Quick Start (Development)

### 1. Clone & Install

```bash
git clone https://github.com/ihyaabrar/Gerai_BKMT.git
cd Gerai_BKMT
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
# PostgreSQL (Neon, Supabase, Railway, dll)
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# Kunci penandatangan cookie sesi — WAJIB di produksi, minimal 32 karakter
AUTH_SECRET="ganti-dengan-string-acak-minimal-32-karakter"

# Cloudinary (untuk upload foto)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your_cloud_name"
```

Generate `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

Tanpa `AUTH_SECRET` yang valid, aplikasi menolak membuat sesi di mode produksi.
Di mode development sebuah kunci sementara dipakai otomatis.

### 3. Setup Database

```bash
# Jalankan migrasi
npx prisma migrate deploy

# Isi data awal
npx prisma db seed
```

### 4. Jalankan

```bash
npm run dev
```

Buka **http://localhost:3000**

### 5. Login

| Role | Username | Password |
|------|----------|----------|
| Master | `admin` | `admin123` |
| Kasir | `kasir` | `kasir123` |

---

## 🚀 Deploy ke Vercel

### 1. Push ke GitHub

```bash
git push origin main
```

### 2. Import di Vercel

Buka [vercel.com](https://vercel.com) → New Project → Import dari GitHub

### 3. Set Environment Variables

Di Vercel Dashboard → Settings → Environment Variables:

```
DATABASE_URL          = postgresql://...
AUTH_SECRET           = <hasil: openssl rand -base64 32>
CLOUDINARY_CLOUD_NAME = your_cloud_name
CLOUDINARY_API_KEY    = your_api_key
CLOUDINARY_API_SECRET = your_api_secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = your_cloud_name
```

### 4. Jalankan Migrasi & Seed

Setelah deploy pertama, jalankan dari terminal lokal dengan DATABASE_URL production:

```bash
npx prisma migrate deploy
npx prisma db seed
```

---

## 📝 Scripts

```bash
npm run dev          # Development server
npm run build        # Build production
npm run start        # Start production server
npm run db:push      # Push schema ke database (tanpa migrasi)
npm run db:migrate   # Deploy migrasi ke production
npm run db:seed      # Isi data awal
npm run db:studio    # Buka Prisma Studio (GUI database)
```

---

## 📂 Struktur Folder

```
gerai-bkmt/
├── prisma/
│   ├── schema.prisma        # Database schema
│   ├── seed.ts              # Data awal
│   └── migrations/          # Riwayat migrasi
├── src/
│   ├── app/
│   │   ├── page.tsx         # Halaman profil publik (/)
│   │   ├── login/           # Halaman login
│   │   ├── berita/[slug]/   # Detail berita publik
│   │   ├── app/             # Sistem kasir (/app)
│   │   ├── admin/           # Admin panel (/admin)
│   │   └── api/             # API routes
│   │       ├── public/      # API publik (tanpa auth)
│   │       ├── admin/       # API admin (butuh auth)
│   │       ├── auth/        # Login & logout
│   │       └── upload/      # Upload gambar ke Cloudinary
│   ├── components/
│   │   ├── layout/          # Sidebar, AuthProvider, AdminSidebar
│   │   ├── public/          # Komponen halaman publik
│   │   └── ui/              # Komponen UI reusable
│   ├── lib/
│   │   ├── prisma.ts        # Prisma client
│   │   ├── cloudinary.ts    # Cloudinary config & upload
│   │   ├── session.ts       # Tanda tangan & verifikasi cookie sesi (HMAC)
│   │   ├── permissions.ts   # Peta hak akses per role (server + client)
│   │   ├── auth-middleware.ts # requireAuth / requireAdminAuth untuk API
│   │   ├── validate.ts      # Validasi & parsing body request
│   │   └── utils.ts         # Utility functions
│   ├── store/
│   │   ├── auth.ts          # Auth state (Zustand)
│   │   └── cart.ts          # Cart state (Zustand + persist)
│   └── types/
│       └── public-profile.ts # TypeScript interfaces
│   └── middleware.ts        # Penjaga route & API di sisi server
├── .env.example             # Template environment variables
├── next.config.js           # Next.js config (Cloudinary domain)
└── tailwind.config.ts       # Tailwind config
```

---

## 🎨 Sistem Warna

| Warna | Penggunaan |
|-------|-----------|
| Emerald/Teal | Primary — halaman publik, kasir |
| Violet/Purple | Admin panel |
| Blue/Indigo | Informasi, laporan |
| Amber/Orange | Warning, pengeluaran |
| Red | Error, hapus |

---

## 💡 Sistem Bagi Hasil

```
Total Laba Bulanan
├── X% → Dana Nasabah
│   └── Dibagi per nasabah sesuai porsi investasi
└── Y% → Dana Pengelola
    ├── Gaji Pegawai (20%)
    ├── Kontribusi Organisasi (20%)
    ├── Dana Sosial (20%)
    ├── Dana Pengembangan (10%)
    └── Operasional & Lainnya (30%)
```

Persentase X dan Y dapat diatur di menu **Pengaturan** (default: 30% nasabah, 70% pengelola).

---

## ⚠️ Catatan Keamanan

- Password di-hash dengan **bcrypt** (auto-upgrade dari plain text saat login)
- Cookie sesi **ditandatangani HMAC-SHA256** dengan `AUTH_SECRET` dan punya masa
  berlaku 12 jam — cookie yang dipalsukan atau kedaluwarsa ditolak
- **Seluruh** route `/app`, `/admin` dan `/api` non-publik dijaga
  `src/middleware.ts` di sisi server, bukan hanya oleh state di browser
- Hak akses per role terpusat di `src/lib/permissions.ts`
- Endpoint tulis memvalidasi field secara eksplisit (tidak ada mass assignment)
- Harga, diskon dan total penjualan **dihitung ulang di server** — angka dari
  browser tidak pernah dipercaya
- Login dibatasi 10 percobaan gagal per username setiap 15 menit
- Upload gambar divalidasi tipe file dan ukuran (maks 5MB)
- File backup tidak menyertakan password pengguna

---

## 📄 Lisensi

MIT License — Lihat [LICENSE](./LICENSE) untuk detail.

---

**Dikembangkan untuk PD BKMT Kabupaten Kubu Raya**  
**Version:** 3.2.0  
**Last Updated:** September 2026
