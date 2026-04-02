# Quick Start Guide - Gerai BKMT

Panduan cepat untuk memulai dalam 5 menit! ⚡

## 📋 Prerequisites

Pastikan sudah terinstall:
- Node.js 18 atau lebih baru
- npm atau yarn

Cek versi:
```bash
node --version  # Should be v18.x or higher
npm --version
```

## 🚀 Installation (3 Steps)

### Step 1: Install Dependencies
```bash
npm install
```
⏱️ Waktu: ~2 menit

### Step 2: Setup Database
```bash
npm run db:push
```
⏱️ Waktu: ~10 detik

### Step 3: Seed Data (Optional)
```bash
npm run db:seed
```
⏱️ Waktu: ~5 detik

## ▶️ Run Application

```bash
npm run dev
```

Buka browser: [http://localhost:3000](http://localhost:3000)

🎉 **Done!** Aplikasi sudah berjalan!

---

## 📱 First Time Usage

### 1. Explore Dashboard
- Lihat statistik penjualan
- Check stok barang
- Lihat transaksi terbaru

### 2. Add Products (Barang Masuk)
```
Sidebar → Inventori → Barang Masuk
```
- Isi form barang baru
- Klik "Generate" untuk barcode otomatis
- Simpan

### 3. Create Member
```
Sidebar → Master Data → Member
```
- Klik "Tambah Member"
- Isi data member
- Simpan

### 4. Make First Sale (Kasir)
```
Sidebar → Kasir
```
- Klik produk untuk add to cart
- Pilih member (optional)
- Klik "Bayar"
- Input jumlah bayar
- Proses pembayaran

### 5. Add Investor (Nasabah)
```
Sidebar → Master Data → Nasabah
```
- Klik "Tambah Nasabah"
- Isi data investor
- Input jumlah investasi
- Simpan

### 6. Check Profit Distribution
```
Sidebar → Keuangan → Distribusi Laba
```
- Lihat total laba bulan ini
- Lihat pembagian 30/70
- Lihat distribusi per nasabah

---

## 🎯 Common Tasks

### Add New Product
```
Inventori → Barang Masuk → Fill Form → Save
```

### Process Sale
```
Kasir → Select Products → Choose Member → Pay
```

### Check Stock
```
Inventori → Stok Barang
```

### View Sales Report
```
Keuangan → Penjualan
```

### Adjust Stock
```
Inventori → Penyesuaian → Select Product → Adjust
```

### Configure Settings
```
Sistem → Pengaturan → Edit → Save
```

---

## 🗄️ Database Management

### View Database
```bash
npm run db:studio
```
Opens Prisma Studio at [http://localhost:5555](http://localhost:5555)

### Reset Database
```bash
npm run db:push -- --force-reset
npm run db:seed
```

### Backup Database
```bash
# Copy database file
cp prisma/dev.db prisma/backup_$(date +%Y%m%d).db
```

---

## 🎨 UI Overview

### Color Meanings
- 🟢 **Emerald**: Primary actions, success
- 🔵 **Blue**: Information, inventory
- 🟡 **Amber**: Warnings, low stock
- 🔴 **Red**: Errors, delete actions
- 🟣 **Violet**: Investors
- 🔷 **Cyan**: Members

### Navigation
- **Sidebar**: Main navigation (always visible on desktop)
- **Quick Actions**: Dashboard shortcuts
- **Search**: Available in Kasir and Stok pages

---

## 📊 Sample Data

Jika sudah run `npm run db:seed`, Anda akan punya:

### Products (5 items)
- Kopi Susu - Rp 12,000
- Nasi Goreng - Rp 18,000
- Es Teh Manis - Rp 5,000
- Mie Goreng - Rp 15,000
- Jus Jeruk - Rp 10,000

### Members (3 people)
- Budi Santoso
- Siti Aminah
- Ahmad Fauzi

### Investors (3 people)
- H. Abdullah (50%)
- Hj. Fatimah (30%)
- Ustadz Yusuf (20%)

### Suppliers (2 companies)
- CV. Sumber Rezeki
- PT. Maju Jaya

---

## 🔧 Troubleshooting

### Port 3000 already in use
```bash
# Option 1: Kill process
npx kill-port 3000

# Option 2: Use different port
npm run dev -- -p 3001
```

### Database locked
```bash
# Close Prisma Studio or other apps using the database
# Then restart
npm run dev
```

### Module not found
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Build errors
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

---

## 📚 Next Steps

1. **Read Full Documentation**
   - [README.md](README.md) - Overview
   - [FEATURES.md](FEATURES.md) - Detailed features
   - [API.md](API.md) - API documentation

2. **Customize Settings**
   - Go to Sistem → Pengaturan
   - Update store name, address
   - Set discount percentage
   - Configure profit sharing ratio

3. **Add Your Data**
   - Add your actual products
   - Register your members
   - Add your investors
   - Configure suppliers

4. **Start Selling!**
   - Process real transactions
   - Monitor inventory
   - Track profits
   - Generate reports

---

## 💡 Tips

### Keyboard Shortcuts (Coming Soon)
- `Ctrl + K`: Quick search
- `Ctrl + N`: New transaction
- `Ctrl + P`: Print receipt

### Best Practices
- ✅ Backup database regularly
- ✅ Update stock after receiving goods
- ✅ Close shift at end of day
- ✅ Review reports weekly
- ✅ Check low stock alerts

### Performance
- Keep database size manageable
- Archive old transactions
- Regular maintenance

---

## 🆘 Need Help?

### Documentation
- [Setup Guide](SETUP.md)
- [Features List](FEATURES.md)
- [API Docs](API.md)
- [Deployment Guide](DEPLOYMENT.md)

### Support
- GitHub Issues: Report bugs
- Discussions: Ask questions
- Email: [your-email]

---

## 🎉 You're Ready!

Selamat! Anda sudah siap menggunakan Gerai BKMT.

**Happy Selling!** 🛒💰

---

## Quick Reference Card

```
┌─────────────────────────────────────────┐
│         GERAI BKMT QUICK REF            │
├─────────────────────────────────────────┤
│ Start Dev:     npm run dev              │
│ Build:         npm run build            │
│ DB Push:       npm run db:push          │
│ DB Seed:       npm run db:seed          │
│ DB Studio:     npm run db:studio        │
├─────────────────────────────────────────┤
│ Dashboard:     /                        │
│ Kasir:         /kasir                   │
│ Stok:          /inventori/stok          │
│ Penjualan:     /keuangan/penjualan      │
│ Distribusi:    /keuangan/distribusi     │
│ Member:        /master/member           │
│ Nasabah:       /master/nasabah          │
│ Pengaturan:    /sistem/pengaturan       │
└─────────────────────────────────────────┘
```
