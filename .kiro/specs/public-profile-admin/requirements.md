# Requirements Document

## Introduction

Fitur ini menambahkan halaman profil publik **PD BKMT Kabupaten Kubu Raya** yang dapat diakses tanpa login, beserta admin panel untuk mengelola konten halaman tersebut. Halaman publik berfungsi sebagai wajah digital organisasi BKMT yang menampilkan profil organisasi, berita/pengumuman, daftar pengurus, dan informasi gerai. Admin panel memungkinkan pengelola konten memperbarui informasi tersebut secara mandiri, terpisah dari sistem kasir yang sudah ada.

Perubahan routing yang diperlukan: route `/` saat ini (dashboard kasir) dipindahkan ke `/app`, sementara route `/` menjadi halaman profil publik yang tidak memerlukan autentikasi.

---

## Konten Awal (Seed Data)

Berdasarkan catatan pemesan dan riset organisasi BKMT, berikut konten awal yang akan digunakan sebagai data seed:

### Profil Organisasi

- **Nama Lengkap:** Pimpinan Daerah Badan Kontak Majelis Taklim Kabupaten Kubu Raya
- **Singkatan:** PD BKMT Kubu Raya
- **Deskripsi:** Organisasi kemasyarakatan Islam yang menjadi wadah koordinasi dan pembinaan majelis taklim di Kabupaten Kubu Raya, Kalimantan Barat. Bergerak di bidang pendidikan keagamaan, pemberdayaan ekonomi umat, dan kegiatan sosial kemasyarakatan.
- **Visi:** Terwujudnya masyarakat Muslim Kabupaten Kubu Raya yang beriman, berilmu, berakhlak mulia, dan berdaya secara ekonomi melalui pembinaan majelis taklim yang terorganisir.
- **Misi:**
  1. Mengkoordinasikan dan membina majelis taklim di seluruh wilayah Kabupaten Kubu Raya
  2. Meningkatkan kualitas pendidikan keagamaan Islam bagi masyarakat, khususnya kaum perempuan
  3. Memberdayakan ekonomi anggota melalui program usaha produktif dan koperasi
  4. Menjalin silaturahmi dan kerjasama antar majelis taklim, pemerintah, dan organisasi Islam lainnya
  5. Mengembangkan generasi muda Islam melalui program Permata BKMT
- **Sejarah:** BKMT (Badan Kontak Majelis Taklim) didirikan secara nasional pada tahun 1981 sebagai organisasi yang mewadahi majelis taklim di seluruh Indonesia. PD BKMT Kabupaten Kubu Raya merupakan pimpinan daerah yang bertugas mengkoordinasikan seluruh kegiatan BKMT di wilayah Kabupaten Kubu Raya, Kalimantan Barat. Kabupaten Kubu Raya sendiri merupakan kabupaten yang terbentuk pada 17 Juli 2007, dengan ibu kota di Sungai Raya, berbatasan langsung dengan Kota Pontianak.
- **Alamat:** Kabupaten Kubu Raya, Kalimantan Barat
- **Wilayah Kerja:** 9 Kecamatan, 20 Pimpinan Cabang (PC), ±130 Permata BKMT

### Struktur Organisasi

Berdasarkan catatan pemesan, struktur organisasi terdiri dari:

1. **Pengurus PD BKMT** — Pimpinan Daerah tingkat Kabupaten (data: nama, NIK, alamat, jabatan)
2. **Pengurus PC BKMT** — 20 Pimpinan Cabang tingkat Kecamatan (data: no, nama, NIK, alamat, jabatan)
3. **Pengurus Permata BKMT** — ±130 kelompok Permata (organisasi remaja/pemuda BKMT)
4. **MT A** — Majelis Taklim tingkat dasar

### Bidang Kegiatan

Sesuai catatan pemesan, terdapat 4 bidang utama:
1. **Profil** — Kelembagaan dan keorganisasian
2. **Pendidikan** — Kajian Islam, TPQ, pelatihan
3. **Ekonomi** — Gerai BKMT, koperasi, usaha produktif anggota
4. **[Bidang ke-4]** — *Akan diisi oleh pemesan*

### Informasi Gerai

- **Nama Gerai:** Gerai BKMT Kubu Raya
- **Deskripsi:** Unit usaha ekonomi produktif PD BKMT Kabupaten Kubu Raya yang menyediakan kebutuhan sehari-hari anggota dan masyarakat sekitar
- **Lokasi:** Kabupaten Kubu Raya, Kalimantan Barat

## Glossary

- **Public_Profile_Page**: Halaman profil publik BKMT yang dapat diakses tanpa login di route `/`
- **Admin_Panel**: Antarmuka pengelolaan konten profil publik, hanya dapat diakses oleh pengguna dengan role `master` atau `admin`, di route `/admin`
- **POS_System**: Sistem kasir dan inventori yang sudah ada, dipindahkan ke route `/app`
- **Berita**: Entitas konten berupa artikel berita atau pengumuman organisasi BKMT
- **Pengurus**: Entitas data anggota pengurus organisasi BKMT beserta jabatan dan foto
- **ProfilOrganisasi**: Entitas data profil dan identitas organisasi BKMT (nama, visi, misi, sejarah, kontak)
- **InformasiGerai**: Entitas data informasi operasional gerai (jam buka, alamat, nomor kontak, produk unggulan)
- **Content_Manager**: Pengguna dengan role `master` atau `admin` yang berwenang mengelola konten profil publik
- **Visitor**: Pengguna yang mengakses Public_Profile_Page tanpa autentikasi
- **Auth_Guard**: Mekanisme proteksi route yang memverifikasi autentikasi dan otorisasi pengguna

---

## Requirements

### Requirement 1: Restrukturisasi Routing Aplikasi

**User Story:** Sebagai pengelola sistem, saya ingin route `/` menjadi halaman publik dan sistem kasir pindah ke `/app`, sehingga pengunjung umum dapat melihat profil BKMT tanpa harus login.

#### Acceptance Criteria

1. THE Public_Profile_Page SHALL dapat diakses di route `/` tanpa autentikasi.
2. THE POS_System SHALL dapat diakses di route `/app` setelah pengguna berhasil login.
3. WHEN pengguna yang belum login mengakses route `/app` atau sub-route di bawahnya, THE Auth_Guard SHALL mengalihkan pengguna ke halaman login di `/login`.
4. WHEN pengguna yang sudah login mengakses route `/`, THE Public_Profile_Page SHALL tetap menampilkan halaman profil publik tanpa mengalihkan ke `/app`.
5. THE Auth_Guard SHALL mengecualikan route `/`, `/login`, dan semua route API publik dari pemeriksaan autentikasi.
6. WHEN pengguna berhasil login, THE POS_System SHALL mengalihkan pengguna ke `/app` sebagai halaman utama setelah login.

---

### Requirement 2: Halaman Profil Publik

**User Story:** Sebagai pengunjung, saya ingin melihat informasi lengkap tentang BKMT Kubu Raya di halaman publik, sehingga saya dapat mengenal organisasi dan gerainya tanpa perlu login.

#### Acceptance Criteria

1. THE Public_Profile_Page SHALL menampilkan nama organisasi, logo, visi, misi, dan deskripsi singkat BKMT Kubu Raya.
2. THE Public_Profile_Page SHALL menampilkan daftar berita dan pengumuman terbaru dengan judul, ringkasan, tanggal publikasi, dan gambar (jika ada).
3. THE Public_Profile_Page SHALL menampilkan daftar pengurus organisasi beserta nama, jabatan, dan foto (jika ada).
4. THE Public_Profile_Page SHALL menampilkan informasi gerai meliputi alamat, jam operasional, nomor kontak, dan deskripsi produk/layanan.
5. THE Public_Profile_Page SHALL menampilkan tombol "Login ke Kasir" yang mengarahkan ke halaman login di `/login`.
6. WHEN Visitor mengklik judul atau ringkasan sebuah Berita, THE Public_Profile_Page SHALL menampilkan konten lengkap berita tersebut.
7. THE Public_Profile_Page SHALL dapat diakses dan ditampilkan dengan benar pada perangkat mobile (lebar layar minimal 320px) dan desktop.
8. WHEN data ProfilOrganisasi, Berita, Pengurus, atau InformasiGerai belum tersedia di database, THE Public_Profile_Page SHALL menampilkan konten placeholder yang informatif.

---

### Requirement 3: Model Data Konten Profil Publik

**User Story:** Sebagai Content_Manager, saya ingin data konten profil publik tersimpan di database, sehingga perubahan konten dapat dipersistensikan dan ditampilkan secara konsisten.

#### Acceptance Criteria

1. THE System SHALL menyimpan data ProfilOrganisasi dengan atribut: nama organisasi, singkatan, deskripsi, visi, misi, sejarah, URL logo, email, telepon, alamat, dan URL media sosial.
2. THE System SHALL menyimpan data Berita dengan atribut: judul, slug unik, konten lengkap (rich text), ringkasan, URL gambar, status publikasi (draft/published), tanggal publikasi, dan ID penulis.
3. THE System SHALL menyimpan data Pengurus dengan atribut: nama, jabatan, periode kepengurusan, URL foto, urutan tampil, dan status aktif.
4. THE System SHALL menyimpan data InformasiGerai dengan atribut: nama gerai, alamat lengkap, jam operasional, nomor telepon, deskripsi layanan, dan koordinat lokasi (opsional).
5. WHEN sebuah Berita dihapus, THE System SHALL menghapus semua data terkait Berita tersebut secara permanen dari database.
6. THE System SHALL memastikan slug Berita bersifat unik di seluruh tabel Berita.

---

### Requirement 4: Admin Panel — Manajemen Profil Organisasi

**User Story:** Sebagai Content_Manager, saya ingin memperbarui informasi profil organisasi BKMT melalui admin panel, sehingga halaman publik selalu menampilkan informasi yang akurat.

#### Acceptance Criteria

1. THE Admin_Panel SHALL dapat diakses di route `/admin` hanya oleh pengguna dengan role `master` atau `admin`.
2. WHEN pengguna dengan role `kasir` mencoba mengakses route `/admin`, THE Auth_Guard SHALL mengalihkan pengguna ke `/app`.
3. THE Admin_Panel SHALL menampilkan form untuk memperbarui data ProfilOrganisasi meliputi nama, deskripsi, visi, misi, sejarah, kontak, dan URL logo.
4. WHEN Content_Manager menyimpan perubahan ProfilOrganisasi, THE Admin_Panel SHALL memvalidasi bahwa nama organisasi tidak kosong sebelum menyimpan ke database.
5. WHEN Content_Manager berhasil menyimpan perubahan ProfilOrganisasi, THE Admin_Panel SHALL menampilkan notifikasi keberhasilan.
6. IF penyimpanan ProfilOrganisasi gagal karena kesalahan server, THEN THE Admin_Panel SHALL menampilkan pesan kesalahan yang deskriptif tanpa menghapus data yang sudah diisi.

---

### Requirement 5: Admin Panel — Manajemen Berita dan Pengumuman

**User Story:** Sebagai Content_Manager, saya ingin membuat, mengedit, dan menghapus berita/pengumuman melalui admin panel, sehingga pengunjung selalu mendapatkan informasi terbaru dari BKMT.

#### Acceptance Criteria

1. THE Admin_Panel SHALL menampilkan daftar semua Berita dengan kolom: judul, status, tanggal publikasi, dan aksi (edit/hapus).
2. THE Admin_Panel SHALL menyediakan form pembuatan Berita baru dengan field: judul, konten, ringkasan, URL gambar, dan status publikasi.
3. WHEN Content_Manager membuat Berita baru, THE Admin_Panel SHALL menghasilkan slug secara otomatis dari judul Berita.
4. WHEN Content_Manager menyimpan Berita, THE Admin_Panel SHALL memvalidasi bahwa judul dan konten tidak kosong.
5. THE Admin_Panel SHALL menyediakan form edit untuk memperbarui data Berita yang sudah ada.
6. WHEN Content_Manager menghapus sebuah Berita, THE Admin_Panel SHALL menampilkan dialog konfirmasi sebelum menghapus data.
7. WHEN Content_Manager mengubah status Berita dari `draft` ke `published`, THE Admin_Panel SHALL menetapkan tanggal publikasi ke waktu saat ini jika belum diisi.
8. THE Public_Profile_Page SHALL hanya menampilkan Berita dengan status `published`.

---

### Requirement 6: Admin Panel — Manajemen Pengurus

**User Story:** Sebagai Content_Manager, saya ingin mengelola daftar pengurus organisasi melalui admin panel, sehingga halaman publik menampilkan susunan pengurus yang terkini.

#### Acceptance Criteria

1. THE Admin_Panel SHALL menampilkan daftar semua Pengurus dengan kolom: nama, jabatan, tingkatan (PD/PC/Permata), periode, urutan tampil, dan aksi (edit/hapus).
2. THE Admin_Panel SHALL menyediakan form untuk menambah Pengurus baru dengan field: nama, NIK (opsional), alamat, jabatan, tingkatan organisasi (PD BKMT / PC BKMT / Permata BKMT), periode kepengurusan, URL foto, dan urutan tampil.
3. THE System SHALL mendukung tiga tingkatan pengurus: **PD BKMT** (Pimpinan Daerah Kabupaten), **PC BKMT** (Pimpinan Cabang Kecamatan, hingga 20 cabang), dan **Permata BKMT** (organisasi remaja/pemuda, hingga 130 kelompok).
4. WHEN Content_Manager menyimpan data Pengurus, THE Admin_Panel SHALL memvalidasi bahwa nama dan jabatan tidak kosong.
5. THE Admin_Panel SHALL menyediakan kemampuan mengubah urutan tampil Pengurus dengan mengubah nilai urutan secara manual.
6. WHEN Content_Manager menghapus data Pengurus, THE Admin_Panel SHALL menampilkan dialog konfirmasi sebelum menghapus data.
7. THE Public_Profile_Page SHALL menampilkan Pengurus yang aktif dikelompokkan berdasarkan tingkatan (PD → PC → Permata) dan diurutkan berdasarkan nilai urutan tampil secara ascending.

---

### Requirement 7: Admin Panel — Manajemen Informasi Gerai

**User Story:** Sebagai Content_Manager, saya ingin memperbarui informasi operasional gerai melalui admin panel, sehingga pengunjung mendapatkan informasi yang akurat tentang gerai BKMT.

#### Acceptance Criteria

1. THE Admin_Panel SHALL menampilkan form untuk memperbarui data InformasiGerai meliputi nama gerai, alamat, jam operasional, nomor telepon, dan deskripsi layanan.
2. WHEN Content_Manager menyimpan perubahan InformasiGerai, THE Admin_Panel SHALL memvalidasi bahwa nama gerai dan alamat tidak kosong.
3. WHEN Content_Manager berhasil menyimpan perubahan InformasiGerai, THE Admin_Panel SHALL menampilkan notifikasi keberhasilan.
4. IF penyimpanan InformasiGerai gagal karena kesalahan server, THEN THE Admin_Panel SHALL menampilkan pesan kesalahan yang deskriptif tanpa menghapus data yang sudah diisi.

---

### Requirement 8: API Publik untuk Konten Profil

**User Story:** Sebagai developer, saya ingin API endpoint publik untuk mengambil data konten profil, sehingga Public_Profile_Page dapat menampilkan data terbaru dari database.

#### Acceptance Criteria

1. THE System SHALL menyediakan endpoint `GET /api/public/profil` yang mengembalikan data ProfilOrganisasi tanpa memerlukan autentikasi.
2. THE System SHALL menyediakan endpoint `GET /api/public/berita` yang mengembalikan daftar Berita berstatus `published` diurutkan berdasarkan tanggal publikasi terbaru, tanpa memerlukan autentikasi.
3. THE System SHALL menyediakan endpoint `GET /api/public/berita/[slug]` yang mengembalikan detail satu Berita berdasarkan slug, tanpa memerlukan autentikasi.
4. THE System SHALL menyediakan endpoint `GET /api/public/pengurus` yang mengembalikan daftar Pengurus aktif diurutkan berdasarkan urutan tampil, tanpa memerlukan autentikasi.
5. THE System SHALL menyediakan endpoint `GET /api/public/gerai` yang mengembalikan data InformasiGerai tanpa memerlukan autentikasi.
6. IF slug Berita yang diminta tidak ditemukan di database, THEN THE System SHALL mengembalikan HTTP status 404 dengan pesan kesalahan yang deskriptif.
7. WHEN endpoint publik dipanggil, THE System SHALL mengembalikan respons dalam format JSON dengan struktur yang konsisten.

---

### Requirement 9: API Admin untuk Pengelolaan Konten

**User Story:** Sebagai developer, saya ingin API endpoint terproteksi untuk operasi CRUD konten profil, sehingga Admin_Panel dapat menyimpan dan memperbarui data dengan aman.

#### Acceptance Criteria

1. THE System SHALL menyediakan endpoint CRUD di `/api/admin/profil`, `/api/admin/berita`, `/api/admin/pengurus`, dan `/api/admin/gerai` yang hanya dapat diakses oleh pengguna dengan role `master` atau `admin`.
2. WHEN request ke endpoint admin diterima tanpa sesi autentikasi yang valid, THE System SHALL mengembalikan HTTP status 401.
3. WHEN request ke endpoint admin diterima dari pengguna dengan role `kasir`, THE System SHALL mengembalikan HTTP status 403.
4. WHEN Content_Manager membuat Berita baru melalui `POST /api/admin/berita`, THE System SHALL memvalidasi keunikan slug sebelum menyimpan ke database.
5. IF slug Berita yang dikirim sudah ada di database, THEN THE System SHALL mengembalikan HTTP status 409 dengan pesan kesalahan yang menjelaskan konflik slug.
6. WHEN Content_Manager memperbarui data melalui endpoint admin, THE System SHALL mengembalikan data terbaru setelah penyimpanan berhasil.

---

### Requirement 10: Navigasi Terintegrasi antara Profil Publik dan Sistem Kasir

**User Story:** Sebagai pengguna, saya ingin navigasi yang jelas antara halaman profil publik dan sistem kasir, sehingga saya dapat berpindah antar bagian aplikasi dengan mudah.

#### Acceptance Criteria

1. THE Public_Profile_Page SHALL menampilkan tombol atau tautan "Login ke Kasir" yang mengarahkan ke `/login`.
2. WHEN pengguna yang sudah login mengunjungi `/login`, THE Auth_Guard SHALL mengalihkan pengguna ke `/app`.
3. THE Admin_Panel SHALL menampilkan tautan navigasi untuk kembali ke Public_Profile_Page di `/`.
4. THE POS_System SHALL menampilkan tautan navigasi untuk melihat Public_Profile_Page di `/` tanpa harus logout.
5. THE Admin_Panel SHALL menampilkan tautan navigasi untuk berpindah ke POS_System di `/app`.
