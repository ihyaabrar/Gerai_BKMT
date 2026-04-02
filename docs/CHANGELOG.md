# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2024-01-01

### Added
- ✨ Dashboard dengan statistik real-time
- 💳 Sistem kasir dengan multiple payment methods
- 📦 Manajemen inventori lengkap
- 💰 Sistem distribusi laba otomatis (30/70)
- 👥 Manajemen member dengan diskon
- 💼 Manajemen nasabah/investor
- 🏪 Pengaturan toko
- 📊 Laporan penjualan
- 🎨 UI/UX dengan Tailwind CSS + shadcn/ui
- 🗄️ Database SQLite dengan Prisma ORM
- 📱 Responsive design (Desktop/Tablet/Mobile)

### Features Detail

#### Dashboard
- Penjualan hari ini
- Laba bulan ini
- Total barang & stok rendah
- 5 Transaksi terbaru
- Top 5 produk terlaris
- Quick actions

#### Kasir
- Product grid dengan search
- Shopping cart dengan qty control
- Member selection untuk diskon
- Multiple payment methods (Tunai/Transfer/QRIS)
- Auto calculate kembalian
- Receipt generation

#### Inventori
- Barang masuk dengan barcode generator
- Monitoring stok real-time
- Alert stok rendah
- Penyesuaian stok
- Retur barang

#### Keuangan
- Riwayat penjualan
- Catat pengeluaran
- Distribusi laba otomatis
- Laporan per periode

#### Master Data
- Member management
- Nasabah/Investor management
- Supplier management

#### Sistem
- Shift kasir
- Pengaturan toko
- Backup data

### Technical
- Next.js 15 App Router
- React 18 with TypeScript
- Zustand for state management
- Prisma ORM with SQLite
- Tailwind CSS for styling
- shadcn/ui components

---

## [Unreleased]

### Planned Features
- [ ] Authentication & Authorization
- [ ] Multi-user with role-based access
- [ ] Print thermal receipt
- [ ] Barcode scanner integration
- [ ] WhatsApp notifications
- [ ] Email reports
- [ ] PWA support
- [ ] Cloud backup
- [ ] Analytics dashboard
- [ ] Customer display
- [ ] Kitchen display system
- [ ] Loyalty program
- [ ] Promo management
- [ ] Multi-branch support

---

## Version History

### [1.0.0] - Initial Release
First stable release with core features:
- POS system
- Inventory management
- Profit distribution
- Member & investor management
