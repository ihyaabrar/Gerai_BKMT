# Responsif Mobile & Tablet

## Masalah

Seluruh area kasir dan admin dibangun dengan lebar sidebar tetap dan tanpa
satu pun breakpoint:

```tsx
<div className="flex">
  <Sidebar />                                {/* w-64, tanpa breakpoint */}
  <main className="flex-1 p-8">{children}</main>
</div>
```

Di layar 375px, sidebar memakan 256px sehingga konten utama hanya tersisa
sekitar 119px. Kartu produk di halaman kasir saling menimpa dan harganya
terpotong — halaman praktis tidak bisa dipakai. Ini penting karena kasir
umumnya justru bekerja dari tablet atau HP, bukan desktop.

## Perubahan

### Sidebar menjadi drawer di bawah 1024px

`src/components/layout/DashboardShell.tsx` menyediakan kerangka bersama untuk
area kasir dan admin:

- Di `<lg`: header dengan tombol menu, sidebar melayang di atas konten dengan
  latar gelap, tertutup otomatis saat pindah halaman, saat menekan Escape,
  atau saat latar diklik. Scroll body dikunci selama drawer terbuka.
- Di `lg` ke atas: tampilan tetap seperti sebelumnya, ditambah sidebar yang
  `sticky` sehingga tidak ikut hilang saat halaman panjang di-scroll.

Status drawer dibagikan lewat React context (`useSidebar`), bukan props,
karena file layout adalah Server Component dan tidak boleh mengoper fungsi
ke Client Component.

### Dialog menjadi sheet di layar kecil

`src/components/ui/dialog.tsx` sebelumnya selalu memusatkan isi tanpa batas
tinggi. Dialog pembayaran kasir jadi terpotong di HP tanpa bisa di-scroll.
Sekarang dialog menempel di bawah layar, punya `max-h` dan area scroll
sendiri, serta bisa ditutup dengan Escape. Semua dialog di aplikasi ikut
terbantu karena perbaikannya di komponen dasar.

### Halaman kasir

- Grid produk: 2 kolom (HP) → 3 (tablet) → 4 (desktop lebar)
- Baris pencarian menumpuk vertikal di HP
- Keranjang hanya `sticky` di desktop
- **Bar pembayaran melayang khusus mobile**: di layar kecil keranjang berada
  di bawah katalog, jadi tanpa ini kasir harus men-scroll melewati seluruh
  daftar produk setiap ingin menyelesaikan transaksi. Bar ini menampilkan
  jumlah item dan total, serta membuka dialog pembayaran langsung.

### Seluruh halaman lain

- Judul halaman: `text-2xl` di HP, `text-3xl` di `sm` ke atas
- Baris header (judul + tombol aksi) membungkus, tidak lagi berdesakan
- Semua tabel dibungkus `overflow-x-auto` dan diberi `min-w-[…]` supaya
  benar-benar bisa digeser, bukan kolomnya yang gepeng
- Grid form dua/tiga kolom menumpuk jadi satu kolom di layar sempit
- Padding konten: `p-4` (HP) → `p-6` (tablet) → `p-8` (desktop)
- `min-w-0` pada `<main>` mencegah konten lebar melebarkan seluruh halaman

## Verifikasi

Diuji pada 375×812 (HP), 768×1024 (tablet), dan 1440×900 (desktop):

- Tidak ada halaman yang menghasilkan scroll horizontal
- Tampilan desktop tidak berubah dari sebelumnya
- 42 uji kontrol akses (`scripts/smoke-test.sh`) tetap lulus
