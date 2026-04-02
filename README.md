# Gerai BKMT - Sistem POS & Inventory

Aplikasi Point of Sale (POS) dan Manajemen Inventori yang dirancang untuk toko/kios dengan sistem investasi khusus. Aplikasi ini mengelola penjualan, stok barang, member, investor (nasabah), dan distribusi laba secara otomatis.

## 📚 Dokumentasi

Dokumentasi lengkap tersedia di folder [`docs/`](./docs/):

- [Setup Guide](./docs/SETUP.md) - Panduan instalasi lengkap
- [Features](./docs/FEATURES.md) - Daftar fitur lengkap
- [API Documentation](./docs/API.md) - Dokumentasi API
- [Architecture](./docs/ARCHITECTURE.md) - Arsitektur sistem
- [Project Status](./docs/PROJECT_STATUS.md) - Status proyek terkini
- [Advanced Features](./docs/ADVANCED_FEATURES.md) - Fitur advanced (pagination, search, export, barcode)
- [Auth & Print](./docs/AUTH_AND_PRINT_IMPLEMENTATION.md) - Implementasi login & print receipt
- [Critical Fixes](./docs/CRITICAL_FIXES.md) - Perbaikan bug critical
- Dan dokumentasi lainnya...

## 🚀 Tech Stack

- **Framework**: Next.js 14 + React 18 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Database**: SQLite + Prisma ORM
- **Notifications**: Sonner
- **Excel Export**: SheetJS (xlsx)
- **Barcode Scanner**: html5-qrcode
- **Date Formatting**: date-fns

## ✨ Status Proyek

✅ **PRODUCTION READY**

- Semua fitur core telah diimplementasikan
- Login system dengan role-based access (Master & Kasir)
- Print receipt otomatis
- Pagination, search & filter
- Export Excel
- Barcode scanner
- 0 TypeScript errors
- Build production successful

Lihat [Project Status](./docs/PROJECT_STATUS.md) untuk detail lengkap.

## 📦 Quick Start

1. **Install dependencies:**
```bash
npm install
```

2. **Setup database:**
```bash
npx prisma migrate dev
npx prisma db seed
```

3. **Run development server:**
```bash
npm run dev
```

4. **Open browser:**
```
http://localhost:3000
```

5. **Login:**
- Master: `admin` / `admin123` (Full access)
- Kasir: `kasir` / `kasir123` (Limited access)

Lihat [Setup Guide](./docs/SETUP.md) untuk panduan lengkap.

## 📱 Fitur Utama

### 1. 🔐 Authentication & Authorization
- Login system dengan 2 role (Master & Kasir)
- Role-based access control
- Session management dengan Zustand persist

### 2. 💳 Point of Sale (Kasir)
- Product grid dengan search real-time
- Barcode scanner dengan kamera
- Shopping cart dengan validasi stok
- Member selection & discount
- Multiple payment methods (Tunai/Transfer/QRIS)
- Auto-calculate total, discount, change
- Print receipt otomatis (thermal 58mm)

### 3. 📦 Inventory Management
- **Barang Masuk**: Input produk baru
- **Stok Barang**: Monitor real-time dengan filter
- **Penyesuaian Stok**: Stock opname & adjustment
- **Retur**: Return management dengan status tracking

### 4. 💰 Financial Management
- **Penjualan**: Transaction history dengan pagination & search
- **Pengeluaran**: Expense tracking by category
- **Distribusi Laba**: Profit distribution (30% nasabah, 70% pengelola)
- **Laporan**: Comprehensive reports dengan Excel export

### 5. 👥 Master Data
- **Member**: Customer management dengan poin & discount
- **Nasabah**: Investor management dengan profit sharing
- **Supplier**: Vendor management

### 6. ⚙️ System Management
- **Shift Kasir**: Shift management dengan saldo tracking
- **Pengaturan**: System configuration
- **Backup**: Database backup & restore

### 7. 🚀 Advanced Features
- **Pagination**: 10 items per page
- **Search & Filter**: Real-time search
- **Export Excel**: Multi-sheet reports
- **Barcode Scanner**: Camera-based scanning
- **Toast Notifications**: Modern notifications

Lihat [Features Documentation](./docs/FEATURES.md) untuk detail lengkap.

## 💡 Sistem Bagi Hasil

```
Total Laba Bulanan
├── 30% → Dana Nasabah
│   └── Dibagi per nasabah sesuai persentase investasi
└── 70% → Dana Pengelola
    ├── Gaji Pegawai
    ├── Kontribusi Organisasi
    ├── Dana Sosial
    └── Dana Pengembangan
```

### Perhitungan:
- Total Laba = Total Penjualan - Total Harga Beli
- Bagian Nasabah = Total Laba × 30%
- Per Nasabah = Bagian Nasabah × (Investasi Nasabah / Total Investasi)

## 🎨 Color System

- **Emerald**: Aksi utama, positif, sukses
- **Teal**: Kasir, transaksi
- **Blue**: Informasi, inventori
- **Amber**: Warning, perhatian
- **Red**: Error, hapus, stok habis
- **Violet**: Nasabah, investasi
- **Cyan**: Member
- **Orange**: Supplier

## 📝 Scripts

```bash
npm run dev          # Development server
npm run build        # Build production
npm run start        # Start production server
npx prisma migrate dev    # Run migrations
npx prisma db seed        # Seed database
npx prisma studio         # Open Prisma Studio
```

## 📂 Project Structure

```
gerai-bkmt/
├── docs/                 # 📚 Dokumentasi lengkap
├── prisma/              # 🗄️ Database schema & migrations
├── src/
│   ├── app/            # 📱 Next.js pages & API routes
│   ├── components/     # 🧩 React components
│   ├── lib/           # 🛠️ Utilities
│   └── store/         # 💾 Zustand stores
├── public/            # 🖼️ Static assets
└── ...config files
```

## 🗂️ Database Schema

12 tables dengan relasi lengkap:
- User, Barang, Member, Nasabah, Supplier
- Penjualan, DetailPenjualan, Pengeluaran
- ShiftKasir, PenyesuaianStok, Retur, Pengaturan

Lihat [Architecture Documentation](./docs/ARCHITECTURE.md) untuk detail schema.

## 🔐 Security

- Input validation
- SQL injection protection (Prisma ORM)
- XSS protection
- Role-based access control
- Session management

⚠️ **Note**: Password hashing belum diimplementasikan (demo only). Untuk production, gunakan bcrypt.

## 📱 Responsive Design

- **Desktop**: Sidebar fixed + content area
- **Tablet**: Sidebar collapse + hamburger menu
- **Mobile**: Sheet drawer menu
- Optimized untuk semua ukuran layar

## 🎨 UI/UX Features

- Modern & clean interface
- Toast notifications (Sonner)
- Loading states
- Empty states
- Error handling
- Smooth transitions
- Accessible components

## 🚀 Deployment

Aplikasi siap untuk production deployment. Lihat [Deployment Guide](./docs/DEPLOYMENT.md) untuk panduan lengkap.

### Checklist Production:
- ✅ All features implemented
- ✅ 0 TypeScript errors
- ✅ Build successful
- ⚠️ Password hashing (recommended)
- ⚠️ Environment variables
- ⚠️ Production database
- ⚠️ HTTPS setup

## 🤝 Contributing

Lihat [Contributing Guide](./docs/CONTRIBUTING.md) untuk panduan kontribusi.

## 📄 License

MIT License - Lihat [LICENSE](./LICENSE) untuk detail.

## 👨‍💻 Support

Untuk pertanyaan atau bantuan, silakan buka issue di repository ini.

---

**Developed with ❤️ for Gerai BKMT**  
**Version:** 2.0.0  
**Last Updated:** 25 Februari 2026
