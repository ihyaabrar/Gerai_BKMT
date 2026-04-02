# API Documentation - Gerai BKMT

## Base URL
```
http://localhost:3000/api
```

## Endpoints

### Barang (Products)

#### GET /api/barang
Get all active products

**Response:**
```json
[
  {
    "id": "clx...",
    "kode": "BRG001",
    "barcode": "1234567890001",
    "nama": "Kopi Susu",
    "kategori": "Minuman",
    "hargaBeli": 8000,
    "hargaJual": 12000,
    "stok": 50,
    "stokMinimum": 10,
    "satuan": "cup",
    "aktif": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### POST /api/barang
Create new product

**Request Body:**
```json
{
  "kode": "BRG001",
  "barcode": "1234567890001",
  "nama": "Kopi Susu",
  "kategori": "Minuman",
  "hargaBeli": 8000,
  "hargaJual": 12000,
  "stok": 50,
  "stokMinimum": 10,
  "satuan": "cup"
}
```

**Response:**
```json
{
  "id": "clx...",
  "kode": "BRG001",
  ...
}
```

---

### Penjualan (Sales)

#### GET /api/penjualan
Get all sales transactions

**Response:**
```json
[
  {
    "id": "clx...",
    "nomorTransaksi": "TRX00001",
    "tanggal": "2024-01-01T10:30:00.000Z",
    "memberId": "clx...",
    "member": {
      "id": "clx...",
      "nama": "Budi Santoso",
      "kode": "MBR00001"
    },
    "subtotal": 30000,
    "diskon": 5,
    "total": 28500,
    "bayar": 30000,
    "kembalian": 1500,
    "metodeBayar": "Tunai",
    "detail": [
      {
        "id": "clx...",
        "barangId": "clx...",
        "barang": {
          "nama": "Kopi Susu",
          "kode": "BRG001"
        },
        "qty": 2,
        "hargaJual": 12000,
        "subtotal": 24000
      }
    ]
  }
]
```

#### POST /api/penjualan
Create new sale transaction

**Request Body:**
```json
{
  "memberId": "clx..." | null,
  "subtotal": 30000,
  "diskon": 5,
  "total": 28500,
  "bayar": 30000,
  "kembalian": 1500,
  "metodeBayar": "Tunai",
  "items": [
    {
      "id": "clx...",
      "qty": 2,
      "hargaJual": 12000,
      "subtotal": 24000
    }
  ]
}
```

**Response:**
```json
{
  "id": "clx...",
  "nomorTransaksi": "TRX00001",
  ...
}
```

---

### Member

#### GET /api/member
Get all active members

**Response:**
```json
[
  {
    "id": "clx...",
    "kode": "MBR00001",
    "nama": "Budi Santoso",
    "telepon": "081234567891",
    "alamat": "Jl. Merdeka No. 1",
    "poin": 100,
    "aktif": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### POST /api/member
Create new member

**Request Body:**
```json
{
  "kode": "MBR00001",
  "nama": "Budi Santoso",
  "telepon": "081234567891",
  "alamat": "Jl. Merdeka No. 1"
}
```

**Response:**
```json
{
  "id": "clx...",
  "kode": "MBR00001",
  ...
}
```

---

### Nasabah (Investors)

#### GET /api/nasabah
Get all active investors

**Response:**
```json
[
  {
    "id": "clx...",
    "nama": "H. Abdullah",
    "telepon": "081234567894",
    "alamat": "Jl. Masjid No. 10",
    "jumlahInvestasi": 10000000,
    "persentase": 50,
    "aktif": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### POST /api/nasabah
Create new investor

**Request Body:**
```json
{
  "nama": "H. Abdullah",
  "telepon": "081234567894",
  "alamat": "Jl. Masjid No. 10",
  "jumlahInvestasi": 10000000,
  "persentase": 50
}
```

**Response:**
```json
{
  "id": "clx...",
  "nama": "H. Abdullah",
  ...
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid request body",
  "message": "Missing required field: nama"
}
```

### 404 Not Found
```json
{
  "error": "Not found",
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Something went wrong"
}
```

---

## Data Types

### Barang
```typescript
interface Barang {
  id: string;
  kode: string;
  barcode?: string;
  nama: string;
  kategori?: string;
  hargaBeli: number;
  hargaJual: number;
  stok: number;
  stokMinimum: number;
  satuan: string;
  aktif: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Penjualan
```typescript
interface Penjualan {
  id: string;
  nomorTransaksi: string;
  tanggal: Date;
  memberId?: string;
  subtotal: number;
  diskon: number;
  total: number;
  bayar: number;
  kembalian: number;
  metodeBayar: string;
  shiftId?: string;
  createdAt: Date;
}
```

### Member
```typescript
interface Member {
  id: string;
  kode: string;
  nama: string;
  telepon?: string;
  alamat?: string;
  poin: number;
  aktif: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Nasabah
```typescript
interface Nasabah {
  id: string;
  nama: string;
  telepon?: string;
  alamat?: string;
  jumlahInvestasi: number;
  persentase: number;
  aktif: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Authentication (Coming Soon)

All endpoints will require authentication in future versions:

```
Authorization: Bearer <token>
```

---

## Rate Limiting (Coming Soon)

- 100 requests per minute per IP
- 1000 requests per hour per user

---

## Webhooks (Coming Soon)

Subscribe to events:
- `sale.created`
- `stock.low`
- `shift.closed`
- `profit.distributed`
