# Implementation Plan: Public Profile & Admin Panel

## Overview

Implementasi fitur profil publik PD BKMT Kubu Raya dan admin panel dalam satu aplikasi Next.js yang sama dengan sistem kasir. Routing direstrukturisasi: POS dipindah ke `/app`, route `/` menjadi halaman publik, dan `/admin` menjadi panel pengelolaan konten. Semua perubahan dilakukan dalam satu project Next.js 14 + TypeScript + Prisma + PostgreSQL yang sudah ada.

## Tasks

- [x] 1. Extend Prisma schema dengan 4 model baru dan jalankan migrasi
  - Tambahkan model `ProfilOrganisasi`, `Berita`, `Pengurus`, `InformasiGerai` ke `prisma/schema.prisma`
  - Tambahkan relasi `berita Berita[]` ke model `User` yang sudah ada
  - Jalankan `prisma migrate dev` untuk membuat migration file baru
  - Jalankan `prisma generate` untuk memperbarui Prisma Client
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 2. Tambahkan TypeScript types dan fungsi utilitas baru
  - [x] 2.1 Buat file `src/types/public-profile.ts` dengan interface `ProfilOrganisasiPublic`, `BeritaPublic`, `BeritaDetailPublic`, `PengurusPublic`, `InformasiGeraiPublic`, dan `ApiResponse<T>`
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 2.2 Tambahkan fungsi `generateSlug(judul: string): string` dan `ensureUniqueSlug(baseSlug: string, existingSlugs: string[]): string` ke `src/lib/utils.ts`
    - Slug hanya mengandung huruf kecil latin, angka, dan tanda hubung
    - `ensureUniqueSlug` menambahkan suffix `-2`, `-3`, dst. jika slug sudah ada
    - _Requirements: 5.3, 3.6, 9.4_

  - [ ]* 2.3 Tulis property test untuk `generateSlug` (Property 1)
    - Install `fast-check` sebagai devDependency: `npm install --save-dev fast-check`
    - Buat file `src/lib/__tests__/utils.test.ts`
    - **Property 1: Slug generation menghasilkan karakter yang valid dan deterministik**
    - **Validates: Requirements 5.3**

  - [ ]* 2.4 Tulis property test untuk `ensureUniqueSlug` (Property 2)
    - Tambahkan ke file `src/lib/__tests__/utils.test.ts`
    - **Property 2: Slug yang dihasilkan selalu unik dari daftar yang sudah ada**
    - **Validates: Requirements 3.6, 9.4**

  - [x] 2.5 Tambahkan fungsi `sortPengurus` dan `filterPublishedBerita` ke `src/lib/utils.ts`
    - `sortPengurus`: urutkan berdasarkan tingkatan (PD → PC → Permata) lalu `urutan` ascending
    - `filterPublishedBerita`: filter hanya berita dengan `status === "published"`
    - _Requirements: 6.7, 8.4, 5.8, 8.2_

  - [ ]* 2.6 Tulis property test untuk `sortPengurus` (Property 4)
    - Tambahkan ke file `src/lib/__tests__/utils.test.ts`
    - **Property 4: Pengurus aktif selalu diurutkan berdasarkan tingkatan lalu urutan**
    - **Validates: Requirements 6.7, 8.4**

  - [ ]* 2.7 Tulis property test untuk `filterPublishedBerita` (Property 5)
    - Tambahkan ke file `src/lib/__tests__/utils.test.ts`
    - **Property 5: Filter berita hanya meloloskan status published**
    - **Validates: Requirements 5.8, 8.2**

- [ ] 3. Checkpoint — Pastikan semua tests utilitas lulus
  - Pastikan semua tests lulus, tanyakan ke user jika ada pertanyaan.

- [x] 4. Restrukturisasi routing: pindahkan POS ke `/app` dan modifikasi layout
  - [x] 4.1 Buat direktori `src/app/app/` dan pindahkan konten POS
    - Buat `src/app/app/layout.tsx` — layout POS dengan `AuthProvider` + `Sidebar`
    - Buat `src/app/app/page.tsx` — salin konten dari `src/app/page.tsx` (Dashboard POS)
    - Pindahkan semua sub-route POS yang ada (`/kasir`, `/inventori`, `/keuangan`, `/master`, `/sistem`) ke dalam `src/app/app/` dengan memperbarui semua link internal
    - _Requirements: 1.2, 1.3_

  - [x] 4.2 Modifikasi `src/app/layout.tsx` (root layout)
    - Hapus `Sidebar` dan `AuthProvider` dari root layout
    - Root layout hanya menyediakan `<html>`, `<body>`, dan `<Toaster>`
    - _Requirements: 1.1, 1.4_

  - [x] 4.3 Modifikasi `AuthProvider` untuk mendukung route publik
    - Tambahkan konstanta `PUBLIC_ROUTES = ["/", "/login"]`
    - Tambahkan pengecekan `pathname.startsWith("/berita/")` sebagai public route
    - Jika public route → render children tanpa cek auth
    - Jika `/admin/**` dan role `kasir` → redirect ke `/app`
    - Jika `/app/**` dan tidak auth → redirect ke `/login`
    - _Requirements: 1.3, 1.4, 1.5, 4.2_

  - [x] 4.4 Modifikasi `Sidebar` untuk menyesuaikan path baru
    - Update semua `href` di `menuItems` agar mengarah ke `/app/*` (contoh: `/app/kasir`, `/app/inventori/stok`, dst.)
    - Update `Dashboard` href ke `/app`
    - Tambahkan link "Lihat Profil Publik" yang mengarah ke `/`
    - Tambahkan link "Admin Panel" (hanya tampil untuk role `master`/`admin`) yang mengarah ke `/admin`
    - _Requirements: 10.3, 10.4, 10.5_

  - [x] 4.5 Modifikasi halaman login untuk redirect ke `/app` setelah berhasil login
    - Ubah `router.push("/")` menjadi `router.push("/app")` di `src/app/login/page.tsx`
    - Tambahkan pengecekan: jika user sudah login dan mengakses `/login`, redirect ke `/app`
    - _Requirements: 1.6, 10.2_

- [x] 5. Implementasi session cookie untuk autentikasi API admin
  - [x] 5.1 Modifikasi `src/app/api/auth/login/route.ts` untuk menyimpan sesi di cookie HTTP-only
    - Set cookie `session` dengan payload `{ id, role, nama }` setelah login berhasil
    - Cookie: `httpOnly: true`, `secure` di production, `sameSite: "lax"`, `maxAge: 7 hari`
    - _Requirements: 9.1, 9.2_

  - [x] 5.2 Modifikasi `src/app/api/auth/logout/route.ts` untuk menghapus cookie sesi
    - Hapus cookie `session` saat logout
    - _Requirements: 9.1_

  - [x] 5.3 Buat `src/lib/auth-middleware.ts` dengan fungsi `requireAdminAuth(request: NextRequest)`
    - Baca cookie `session` dari request
    - Jika tidak ada sesi → return `NextResponse` dengan status 401 dan `{ error: "Autentikasi diperlukan" }`
    - Jika role `kasir` → return `NextResponse` dengan status 403 dan `{ error: "Akses ditolak" }`
    - Jika valid (role `master`/`admin`) → return `{ user: SessionUser }`
    - _Requirements: 9.1, 9.2, 9.3_

  - [ ]* 5.4 Tulis property test untuk `requireAdminAuth` (Property 6)
    - Buat file `src/lib/__tests__/auth-middleware.test.ts`
    - **Property 6: Semua endpoint admin menolak akses tidak sah**
    - Test dengan sesi null → harus 401; role kasir → harus 403
    - **Validates: Requirements 9.1, 9.2, 9.3**

- [x] 6. Implementasi API publik (`/api/public/*`)
  - [x] 6.1 Buat `src/app/api/public/profil/route.ts`
    - `GET`: query `ProfilOrganisasi` pertama dari database, return JSON
    - Jika tidak ada data → return `{ data: null }`
    - _Requirements: 8.1_

  - [x] 6.2 Buat `src/app/api/public/berita/route.ts`
    - `GET`: query semua `Berita` dengan `status: "published"`, urutkan `tanggalPublikasi` descending
    - Return hanya field publik (tanpa `konten` lengkap untuk list)
    - _Requirements: 8.2, 5.8_

  - [x] 6.3 Buat `src/app/api/public/berita/[slug]/route.ts`
    - `GET`: query `Berita` berdasarkan `slug` dengan `status: "published"`
    - Jika tidak ditemukan → return HTTP 404 dengan `{ error: "Berita tidak ditemukan" }`
    - _Requirements: 8.3, 8.6, 8.7_

  - [x] 6.4 Buat `src/app/api/public/pengurus/route.ts`
    - `GET`: query semua `Pengurus` dengan `aktif: true`, urutkan berdasarkan tingkatan lalu `urutan`
    - _Requirements: 8.4, 6.7_

  - [x] 6.5 Buat `src/app/api/public/gerai/route.ts`
    - `GET`: query `InformasiGerai` pertama dari database, return JSON
    - _Requirements: 8.5_

- [x] 7. Implementasi API admin (`/api/admin/*`)
  - [x] 7.1 Buat `src/app/api/admin/profil/route.ts`
    - `GET`: return data `ProfilOrganisasi` (memerlukan auth admin)
    - `PUT`: update `ProfilOrganisasi`, validasi `nama` tidak kosong, return data terbaru
    - Gunakan `requireAdminAuth()` di setiap handler
    - _Requirements: 9.1, 4.3, 4.4, 4.5, 4.6, 9.6_

  - [x] 7.2 Buat `src/app/api/admin/berita/route.ts`
    - `GET`: return semua `Berita` (semua status) untuk admin
    - `POST`: buat `Berita` baru, validasi `judul` dan `konten` tidak kosong, generate slug unik, auto-set `tanggalPublikasi` jika status `published`
    - Return HTTP 409 jika slug duplikat
    - _Requirements: 9.1, 5.2, 5.3, 5.4, 5.7, 9.4, 9.5_

  - [x] 7.3 Buat `src/app/api/admin/berita/[id]/route.ts`
    - `GET`: return detail satu `Berita` berdasarkan ID
    - `PUT`: update `Berita`, validasi field wajib, auto-set `tanggalPublikasi` saat publish, return data terbaru
    - `DELETE`: hapus `Berita` secara permanen
    - _Requirements: 9.1, 5.5, 5.7, 3.5, 9.6_

  - [ ]* 7.4 Tulis property test untuk logika publish berita (Property 3)
    - Buat file `src/lib/__tests__/berita-logic.test.ts`
    - Ekstrak fungsi `applyPublishLogic` sebagai pure function yang dapat ditest
    - **Property 3: Berita yang di-publish selalu memiliki tanggalPublikasi**
    - **Validates: Requirements 5.7**

  - [x] 7.5 Buat `src/app/api/admin/pengurus/route.ts`
    - `GET`: return semua `Pengurus`
    - `POST`: buat `Pengurus` baru, validasi `nama` dan `jabatan` tidak kosong, validasi `tingkatan` harus `PD`/`PC`/`Permata`
    - _Requirements: 9.1, 6.2, 6.4_

  - [x] 7.6 Buat `src/app/api/admin/pengurus/[id]/route.ts`
    - `GET`: return detail satu `Pengurus`
    - `PUT`: update `Pengurus`, validasi field wajib, return data terbaru
    - `DELETE`: hapus `Pengurus` secara permanen
    - _Requirements: 9.1, 6.5, 6.6, 9.6_

  - [x] 7.7 Buat `src/app/api/admin/gerai/route.ts`
    - `GET`: return data `InformasiGerai`
    - `PUT`: update `InformasiGerai`, validasi `nama` dan `alamat` tidak kosong, return data terbaru
    - _Requirements: 9.1, 7.1, 7.2, 7.3, 7.4, 9.6_

  - [ ]* 7.8 Tulis property test untuk admin API update (Property 7)
    - Tambahkan ke `src/lib/__tests__/berita-logic.test.ts` atau buat file baru
    - Ekstrak dan test fungsi validasi dan transformasi data sebagai pure functions
    - **Property 7: Update data melalui admin API mengembalikan data terbaru**
    - **Validates: Requirements 9.6**

- [ ] 8. Checkpoint — Pastikan semua API routes berfungsi dan tests lulus
  - Pastikan semua tests lulus, tanyakan ke user jika ada pertanyaan.

- [x] 9. Buat komponen halaman profil publik
  - [x] 9.1 Buat `src/components/public/PublicHeader.tsx`
    - Navbar dengan nama organisasi, logo (jika ada), navigasi anchor ke seksi halaman
    - Tombol "Login ke Kasir" yang mengarah ke `/login`
    - Responsive untuk mobile dan desktop
    - _Requirements: 2.5, 10.1_

  - [x] 9.2 Buat `src/components/public/HeroSection.tsx`
    - Tampilkan nama organisasi, singkatan, deskripsi, visi, dan misi
    - Tampilkan placeholder informatif jika data null
    - _Requirements: 2.1, 2.8_

  - [x] 9.3 Buat `src/components/public/BeritaSection.tsx`
    - Grid kartu berita (maksimal 6 berita terbaru)
    - Setiap kartu menampilkan judul, ringkasan, tanggal, dan gambar (jika ada)
    - Kartu dapat diklik untuk navigasi ke `/berita/[slug]`
    - Tampilkan placeholder jika tidak ada berita
    - _Requirements: 2.2, 2.6, 2.8_

  - [x] 9.4 Buat `src/components/public/PengurusSection.tsx`
    - Tampilkan pengurus dikelompokkan berdasarkan tingkatan (PD → PC → Permata)
    - Setiap item menampilkan nama, jabatan, periode, dan foto (jika ada)
    - Tampilkan placeholder jika tidak ada pengurus
    - _Requirements: 2.3, 2.8_

  - [x] 9.5 Buat `src/components/public/GeraiSection.tsx`
    - Tampilkan nama gerai, alamat, jam operasional, nomor kontak, dan deskripsi
    - Tampilkan placeholder jika data null
    - _Requirements: 2.4, 2.8_

- [x] 10. Buat halaman profil publik (`/`) dan halaman detail berita
  - [x] 10.1 Ganti `src/app/page.tsx` dengan Public Profile Page (Server Component)
    - Fetch data dari Prisma langsung (bukan via API) untuk SEO-friendly
    - Render `PublicHeader`, `HeroSection`, `BeritaSection`, `PengurusSection`, `GeraiSection`
    - Halaman dapat diakses tanpa autentikasi
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 1.1, 1.4_

  - [x] 10.2 Buat `src/app/berita/[slug]/page.tsx` (Server Component)
    - Fetch detail berita berdasarkan slug dari Prisma
    - Jika tidak ditemukan → panggil `notFound()` dari Next.js
    - Tampilkan judul, konten lengkap, tanggal publikasi, dan nama penulis
    - Tambahkan link "Kembali ke Beranda"
    - _Requirements: 2.6, 8.3, 8.6_

  - [x] 10.3 Pastikan halaman publik responsive (mobile 320px hingga desktop)
    - Gunakan Tailwind responsive classes (`sm:`, `md:`, `lg:`)
    - _Requirements: 2.7_

- [x] 11. Buat Admin Panel
  - [x] 11.1 Buat `src/app/admin/layout.tsx`
    - Layout admin dengan `AuthProvider` dan `AdminSidebar`
    - Proteksi route: hanya role `master`/`admin` yang dapat akses
    - _Requirements: 4.1, 4.2_

  - [x] 11.2 Buat `src/components/layout/AdminSidebar.tsx`
    - Navigasi ke: Dashboard Admin, Profil Organisasi, Berita, Pengurus, Informasi Gerai
    - Tautan "Lihat Profil Publik" ke `/`
    - Tautan "Ke Sistem Kasir" ke `/app`
    - _Requirements: 10.3, 10.5_

  - [x] 11.3 Buat `src/app/admin/page.tsx` — Dashboard Admin
    - Tampilkan ringkasan: jumlah berita published, jumlah pengurus aktif, status profil
    - _Requirements: 4.1_

  - [x] 11.4 Buat `src/app/admin/profil/page.tsx` dengan `ProfilForm`
    - Form edit profil organisasi: nama, singkatan, deskripsi, visi, misi, sejarah, kontak, URL logo, media sosial
    - Validasi client-side: nama tidak boleh kosong
    - Loading state pada tombol submit
    - Notifikasi sukses/error menggunakan `sonner`
    - Data tidak hilang jika request gagal
    - _Requirements: 4.3, 4.4, 4.5, 4.6_

  - [x] 11.5 Buat `src/app/admin/berita/page.tsx` — Daftar Berita
    - Tabel dengan kolom: judul, status (badge), tanggal publikasi, aksi (edit/hapus)
    - Tombol "Buat Berita Baru" yang mengarah ke `/admin/berita/baru`
    - Dialog konfirmasi sebelum hapus
    - _Requirements: 5.1, 5.6_

  - [x] 11.6 Buat `src/app/admin/berita/baru/page.tsx` dengan `BeritaForm`
    - Form buat berita: judul, konten (textarea), ringkasan, URL gambar, status publikasi
    - Auto-generate slug dari judul (tampilkan preview slug)
    - Validasi: judul dan konten tidak boleh kosong
    - Auto-set `tanggalPublikasi` saat status `published`
    - _Requirements: 5.2, 5.3, 5.4, 5.7_

  - [x] 11.7 Buat `src/app/admin/berita/[id]/page.tsx` — Edit Berita
    - Form edit berita yang sudah ada (sama dengan form buat, tapi pre-filled)
    - _Requirements: 5.5_

  - [x] 11.8 Buat `src/app/admin/pengurus/page.tsx` — Daftar Pengurus
    - Tabel dengan kolom: nama, jabatan, tingkatan, periode, urutan, aksi (edit/hapus)
    - Tombol "Tambah Pengurus" yang mengarah ke `/admin/pengurus/baru`
    - Dialog konfirmasi sebelum hapus
    - _Requirements: 6.1, 6.6_

  - [x] 11.9 Buat `src/app/admin/pengurus/baru/page.tsx` dengan `PengurusForm`
    - Form tambah pengurus: nama, NIK (opsional), alamat, jabatan, tingkatan (dropdown: PD/PC/Permata), periode, URL foto, urutan tampil
    - Validasi: nama dan jabatan tidak boleh kosong
    - _Requirements: 6.2, 6.3, 6.4_

  - [x] 11.10 Buat `src/app/admin/pengurus/[id]/page.tsx` — Edit Pengurus
    - Form edit pengurus yang sudah ada (pre-filled)
    - _Requirements: 6.5_

  - [x] 11.11 Buat `src/app/admin/gerai/page.tsx` dengan `GeraiForm`
    - Form edit informasi gerai: nama, alamat, jam operasional, telepon, deskripsi
    - Validasi: nama dan alamat tidak boleh kosong
    - Notifikasi sukses/error menggunakan `sonner`
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 12. Buat seed data awal BKMT Kubu Raya
  - [x] 12.1 Modifikasi `prisma/seed.ts` untuk menambahkan data awal
    - Seed `ProfilOrganisasi` dengan data lengkap PD BKMT Kubu Raya (nama, singkatan, deskripsi, visi, misi, sejarah, alamat)
    - Seed `InformasiGerai` dengan data Gerai BKMT Kubu Raya
    - Seed beberapa `Pengurus` contoh untuk tingkatan PD, PC, dan Permata
    - Seed 1-2 `Berita` contoh dengan status `published`
    - Gunakan `upsert` agar seed dapat dijalankan ulang tanpa duplikasi
    - _Requirements: Semua requirement konten awal dari dokumen requirements_

- [x] 13. Checkpoint akhir — Verifikasi integrasi end-to-end
  - Pastikan semua tests lulus, tanyakan ke user jika ada pertanyaan.
  - Verifikasi: halaman `/` dapat diakses tanpa login
  - Verifikasi: route `/app` memerlukan login dan redirect ke `/login` jika belum auth
  - Verifikasi: route `/admin` hanya dapat diakses role `master`/`admin`
  - Verifikasi: login redirect ke `/app` bukan `/`

## Notes

- Tasks bertanda `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap task mereferensikan requirement spesifik untuk traceability
- Checkpoint memastikan validasi inkremental di setiap fase
- Property tests memvalidasi properti universal yang harus berlaku untuk semua input
- Unit tests memvalidasi contoh spesifik dan edge cases
- Design menggunakan TypeScript — semua implementasi menggunakan TypeScript
- Halaman publik menggunakan Next.js Server Components untuk SEO-friendly rendering
- Admin panel menggunakan Client Components karena memerlukan interaktivitas form
