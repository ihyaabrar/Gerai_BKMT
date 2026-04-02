# Setup Guide - Gerai BKMT

## Langkah-langkah Setup

### 1. Prerequisites
Pastikan sudah terinstall:
- Node.js 18+ 
- npm atau yarn

### 2. Clone & Install

```bash
# Install dependencies
npm install
```

### 3. Setup Database

```bash
# Push schema ke SQLite database
npm run db:push
```

Database akan dibuat di `prisma/dev.db`

### 4. (Opsional) Seed Data Awal

Buat file `prisma/seed.ts` untuk data dummy:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Buat pengaturan default
  await prisma.pengaturan.create({
    data: {
      namaToko: "Gerai BKMT",
      prefixTransaksi: "TRX",
      diskonMember: 5,
      persenNasabah: 30,
      persenPengelola: 70,
    },
  });

  // Buat barang contoh
  await prisma.barang.createMany({
    data: [
      {
        kode: "BRG001",
        nama: "Kopi Susu",
        kategori: "Minuman",
        hargaBeli: 8000,
        hargaJual: 12000,
        stok: 50,
        stokMinimum: 10,
        satuan: "cup",
      },
      {
        kode: "BRG002",
        nama: "Nasi Goreng",
        kategori: "Makanan",
        hargaBeli: 12000,
        hargaJual: 18000,
        stok: 30,
        stokMinimum: 5,
        satuan: "porsi",
      },
    ],
  });

  console.log("Seed data berhasil!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Jalankan seed:
```bash
npx tsx prisma/seed.ts
```

### 5. Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

### 6. Explore Database (Opsional)

```bash
npm run db:studio
```

Prisma Studio akan terbuka di browser untuk melihat/edit data.

## Troubleshooting

### Error: Cannot find module '@prisma/client'
```bash
npm install @prisma/client
npm run db:push
```

### Database locked
Tutup Prisma Studio atau aplikasi lain yang mengakses database.

### Port 3000 sudah digunakan
Ubah port di `package.json`:
```json
"dev": "next dev -p 3001"
```

## Production Build

```bash
# Build
npm run build

# Start production server
npm run start
```

## Deployment

### Vercel (Recommended)
1. Push ke GitHub
2. Import project di Vercel
3. Deploy otomatis

### Manual Server
1. Build: `npm run build`
2. Copy folder `.next`, `public`, `prisma`, `package.json`
3. Install dependencies: `npm install --production`
4. Setup database: `npm run db:push`
5. Start: `npm start`

## Tips

- Backup database secara berkala (copy file `prisma/dev.db`)
- Gunakan environment variables untuk production
- Setup HTTPS untuk keamanan
- Monitoring error dengan Sentry atau sejenisnya
