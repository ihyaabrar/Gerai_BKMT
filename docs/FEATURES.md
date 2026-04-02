# Fitur Lengkap - Gerai BKMT

## 1. Dashboard 🏠

### Statistik Real-time
- 💰 Penjualan hari ini
- 📈 Laba bulan ini
- 📦 Total barang aktif
- ⚠️ Alert stok rendah

### Widget Informasi
- 🕐 5 Transaksi terbaru dengan detail
- 🏆 Top 5 produk terlaris
- 📊 Grafik penjualan (coming soon)

### Quick Actions
- Transaksi Baru → Langsung ke kasir
- Barang Masuk → Input stok baru
- Lihat Stok → Monitoring inventori
- Laporan → Cetak laporan

---

## 2. Kasir 💳

### Product Selection
- **Grid View**: Tampilan produk dalam grid card
- **Search**: Cari berdasarkan nama/kode
- **Barcode Scanner**: Scan barcode produk
- **Stock Info**: Indikator stok tersedia
- **Price Display**: Harga jual jelas

### Shopping Cart
- Add/Remove items
- Quantity control (+/-)
- Real-time subtotal calculation
- Stock validation
- Clear cart

### Member Integration
- Pilih member dari daftar
- Diskon otomatis (default 5%)
- Poin reward (coming soon)
- Member info display

### Payment Processing
- **Multiple Methods**:
  - Tunai
  - Transfer Bank
  - QRIS
- **Quick Amount Buttons**: 50k, 100k, 150k, 200k
- **Auto Calculate**: Kembalian otomatis
- **Receipt**: Struk digital
- **Print**: Cetak struk (coming soon)

### Transaction Features
- Hold transaction (coming soon)
- Transaction history
- Void/Cancel (coming soon)

---

## 3. Inventori 📦

### 3a. Barang Masuk
- **Form Input Lengkap**:
  - Kode barang (manual)
  - Barcode (auto-generate)
  - Nama produk
  - Kategori
  - Harga beli & jual
  - Stok awal
  - Stok minimum
  - Satuan (pcs, kg, liter, dll)

- **Barcode Generator**: Generate barcode unik otomatis
- **Validation**: Input validation
- **Success Feedback**: Konfirmasi berhasil

### 3b. Stok Barang
- **Real-time Monitoring**:
  - Total barang
  - Stok rendah count
  - Nilai inventori total

- **Table View**:
  - Kode & nama barang
  - Kategori
  - Harga beli & jual
  - Stok saat ini
  - Status (Aman/Rendah/Habis)

- **Visual Indicators**:
  - 🟢 Hijau: Stok aman
  - 🟡 Kuning: Stok rendah
  - 🔴 Merah: Stok habis

- **Filter**: Semua / Rendah / Habis
- **Search**: Cari barang
- **Export**: Excel/PDF (coming soon)

### 3c. Penyesuaian Stok
- **Stock Opname**: Koreksi stok fisik
- **Adjustment Types**:
  - Tambah stok
  - Kurangi stok
- **Reason Tracking**: Catat alasan penyesuaian
- **History**: Riwayat penyesuaian

### 3d. Retur
- **Return Management**:
  - Pilih barang
  - Jumlah retur
  - Alasan retur
  - Status (Proses/Selesai)
- **Supplier Integration**: Link ke supplier
- **History**: Riwayat retur

---

## 4. Keuangan 💰

### 4a. Penjualan
- **Transaction List**:
  - Nomor transaksi
  - Tanggal & waktu
  - Member/Umum
  - Subtotal, diskon, total
  - Metode pembayaran

- **Detail View**: Lihat item per transaksi
- **Filter**: Per periode
- **Export**: Laporan penjualan
- **Print**: Cetak ulang struk

### 4b. Pengeluaran
- **Expense Tracking**:
  - Tanggal
  - Kategori (Gaji, Listrik, Sewa, dll)
  - Keterangan
  - Jumlah

- **Categories**:
  - Gaji pegawai
  - Listrik & air
  - Sewa tempat
  - Transportasi
  - Lain-lain

- **Summary**: Total pengeluaran per periode
- **Report**: Laporan pengeluaran

### 4c. Distribusi Laba ⭐

**Sistem Bagi Hasil Otomatis**

#### Perhitungan Laba
```
Total Laba = Total Penjualan - Total Harga Beli
```

#### Pembagian
```
┌─────────────────────────────────────┐
│         TOTAL LABA BULANAN          │
├─────────────────┬───────────────────┤
│  NASABAH (30%)  │  PENGELOLA (70%)  │
└─────────────────┴───────────────────┘
```

#### Distribusi Nasabah
```
Per Nasabah = Bagian Nasabah × (Investasi Nasabah / Total Investasi)
```

#### Features
- Auto calculation per bulan
- Visual breakdown per nasabah
- Progress bar persentase
- Estimasi bagi hasil
- Export laporan distribusi

#### Alokasi Pengelola (70%)
- Gaji pegawai
- Kontribusi organisasi
- Dana sosial
- Dana pengembangan

### 4d. Laporan
- **Sales Report**: Ringkasan penjualan
- **Profit Report**: Analisis laba
- **Inventory Report**: Nilai inventori
- **Period Comparison**: Perbandingan periode
- **Export**: PDF/Excel
- **Print**: Cetak laporan

---

## 5. Master Data 👥

### 5a. Member
- **Member Management**:
  - Kode member (auto-generate)
  - Nama lengkap
  - Telepon
  - Alamat
  - Poin reward

- **Features**:
  - Add/Edit/Delete member
  - Search member
  - Poin history (coming soon)
  - Member card print (coming soon)

- **Benefits**:
  - Diskon otomatis
  - Poin reward
  - Special promo

### 5b. Nasabah/Investor
- **Investor Management**:
  - Nama investor
  - Kontak
  - Jumlah investasi
  - Persentase kepemilikan
  - Estimasi bagi hasil

- **Dashboard**:
  - Total investasi
  - Jumlah nasabah
  - Distribusi persentase

- **Features**:
  - Add/Edit investor
  - Calculate ownership
  - Profit distribution
  - Investment history

### 5c. Supplier
- **Supplier Management**:
  - Nama supplier
  - Kontak person
  - Telepon
  - Alamat
  - Email

- **Features**:
  - Add/Edit/Delete supplier
  - Purchase history (coming soon)
  - Payment tracking (coming soon)

---

## 6. Sistem ⚙️

### 6a. Shift Kasir
- **Shift Management**:
  - Buka shift dengan saldo awal
  - Tutup shift dengan rekap
  - Multiple kasir support

- **Shift Report**:
  - Saldo awal
  - Total penjualan
  - Total transaksi
  - Saldo akhir
  - Selisih (jika ada)

- **History**: Riwayat shift per kasir

### 6b. Pengaturan
- **Toko Settings**:
  - Nama toko
  - Alamat
  - Telepon
  - Logo (coming soon)

- **Transaction Settings**:
  - Prefix nomor transaksi
  - Auto-increment

- **Member Settings**:
  - Diskon member (%)
  - Poin per transaksi

- **Profit Sharing**:
  - Persentase nasabah (default 30%)
  - Persentase pengelola (default 70%)

### 6c. Backup
- **Database Backup**:
  - Manual backup
  - Auto backup (coming soon)
  - Backup schedule

- **Restore**:
  - Restore from backup
  - Backup history

- **Export**:
  - Export all data
  - Import data

---

## 🎨 UI/UX Features

### Design System
- **Color Coding**:
  - Emerald: Primary actions
  - Teal: Kasir
  - Blue: Info
  - Amber: Warning
  - Red: Error/Delete
  - Violet: Investor
  - Cyan: Member

### Responsive
- Desktop: Full sidebar
- Tablet: Collapsible sidebar
- Mobile: Drawer menu

### Accessibility
- Keyboard navigation
- Screen reader support
- High contrast mode
- Focus indicators

### Performance
- Lazy loading
- Image optimization
- Code splitting
- Caching strategy

---

## 🔐 Security Features

- Input validation
- SQL injection protection (Prisma)
- XSS protection
- CSRF tokens
- Password hashing (coming soon)
- Role-based access (coming soon)
- Audit log (coming soon)

---

## 📊 Reporting Features

### Available Reports
- Daily sales report
- Monthly profit report
- Inventory valuation
- Best selling products
- Member statistics
- Investor distribution

### Export Formats
- PDF
- Excel
- CSV
- Print

---

## 🚀 Coming Soon

- [ ] Authentication & Authorization
- [ ] Multi-user with roles
- [ ] Print receipt thermal
- [ ] Barcode scanner integration
- [ ] WhatsApp notification
- [ ] Email reports
- [ ] Mobile app (PWA)
- [ ] Cloud backup
- [ ] Analytics dashboard
- [ ] Customer display
- [ ] Kitchen display system
- [ ] Loyalty program
- [ ] Promo management
- [ ] Multi-branch support
