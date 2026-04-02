# Testing Guide - Gerai BKMT

## Manual Testing Checklist

### 1. Dashboard Testing ✅

#### Test Cases:
- [ ] Dashboard loads successfully
- [ ] Penjualan hari ini displays correct amount
- [ ] Laba bulan ini calculates correctly
- [ ] Total barang count is accurate
- [ ] Stok rendah alert shows correct count
- [ ] 5 Transaksi terbaru displays
- [ ] Top 5 produk terlaris shows
- [ ] Quick action buttons work

#### Steps:
```
1. Navigate to /
2. Verify all stats cards load
3. Check transaction list
4. Click quick action buttons
5. Verify navigation works
```

---

### 2. Kasir (POS) Testing 💳

#### Test Cases:
- [ ] Product grid displays all products
- [ ] Search functionality works
- [ ] Add to cart works
- [ ] Quantity increase/decrease works
- [ ] Remove from cart works
- [ ] Member selection works
- [ ] Discount applies correctly
- [ ] Payment dialog opens
- [ ] Payment methods selectable
- [ ] Quick amount buttons work
- [ ] Kembalian calculates correctly
- [ ] Transaction processes successfully
- [ ] Stock updates after sale
- [ ] Cart clears after payment

#### Steps:
```
1. Go to /kasir
2. Search for "Kopi"
3. Click product to add to cart
4. Increase quantity to 2
5. Click "Member" button
6. Select a member
7. Verify discount applied
8. Click "Bayar"
9. Select payment method
10. Enter amount (e.g., 50000)
11. Verify kembalian shown
12. Click "Proses Pembayaran"
13. Verify success message
14. Check stock decreased
```

#### Edge Cases:
- [ ] Add product with 0 stock (should show alert)
- [ ] Increase qty beyond stock (button disabled)
- [ ] Pay with insufficient amount (should alert)
- [ ] Empty cart checkout (button disabled)

---

### 3. Inventori Testing 📦

#### 3a. Barang Masuk
- [ ] Form displays correctly
- [ ] All fields accept input
- [ ] Barcode generator works
- [ ] Form validation works
- [ ] Product saves successfully
- [ ] Redirect/feedback after save

#### Steps:
```
1. Go to /inventori/barang-masuk
2. Fill form:
   - Kode: BRG999
   - Click "Generate" for barcode
   - Nama: Test Product
   - Kategori: Test
   - Harga Beli: 5000
   - Harga Jual: 8000
   - Stok: 100
   - Stok Minimum: 10
   - Satuan: pcs
3. Click "Simpan Barang"
4. Verify success message
5. Check product in stok page
```

#### 3b. Stok Barang
- [ ] All products display
- [ ] Stats cards show correct data
- [ ] Status badges correct (Aman/Rendah/Habis)
- [ ] Table sortable
- [ ] Search works

#### Steps:
```
1. Go to /inventori/stok
2. Verify all products listed
3. Check status colors:
   - Green = Aman
   - Yellow = Rendah
   - Red = Habis
4. Verify nilai inventori calculation
```

#### 3c. Penyesuaian Stok
- [ ] Product selection works
- [ ] Jenis selection (Masuk/Keluar) works
- [ ] Quantity input works
- [ ] Reason required
- [ ] Adjustment saves

#### 3d. Retur
- [ ] Page loads
- [ ] Empty state shows

---

### 4. Keuangan Testing 💰

#### 4a. Penjualan
- [ ] Transaction list displays
- [ ] All transaction details shown
- [ ] Date format correct
- [ ] Member name shows
- [ ] Amounts calculate correctly
- [ ] Payment method displays

#### Steps:
```
1. Go to /keuangan/penjualan
2. Verify transactions listed
3. Check calculations:
   - Subtotal
   - Diskon
   - Total
4. Verify member names
```

#### 4b. Distribusi Laba
- [ ] Total laba calculates correctly
- [ ] 30/70 split correct
- [ ] Per nasabah calculation correct
- [ ] Percentage bars display
- [ ] Investment amounts show

#### Steps:
```
1. Go to /keuangan/distribusi
2. Verify total laba
3. Check 30% nasabah amount
4. Check 70% pengelola amount
5. Verify per-nasabah distribution
6. Check percentage calculations
```

#### Calculation Test:
```
Given:
- Total Sales: Rp 1,000,000
- Total Cost: Rp 600,000
- Profit: Rp 400,000

Expected:
- Nasabah (30%): Rp 120,000
- Pengelola (70%): Rp 280,000

If Nasabah A has 50% investment:
- Nasabah A gets: Rp 60,000
```

---

### 5. Master Data Testing 👥

#### 5a. Member
- [ ] Member list displays
- [ ] Add member form works
- [ ] Kode auto-generates
- [ ] Member saves successfully
- [ ] Member appears in list

#### Steps:
```
1. Go to /master/member
2. Click "Tambah Member"
3. Fill form:
   - Nama: Test Member
   - Telepon: 081234567890
   - Alamat: Test Address
4. Click "Simpan Member"
5. Verify in list
6. Check kode format (MBR00XXX)
```

#### 5b. Nasabah
- [ ] Investor list displays
- [ ] Total investasi calculates
- [ ] Add investor form works
- [ ] Percentage calculates
- [ ] Estimasi bagi hasil shows

#### Steps:
```
1. Go to /master/nasabah
2. Note total investasi
3. Click "Tambah Nasabah"
4. Fill form:
   - Nama: Test Investor
   - Telepon: 081234567890
   - Alamat: Test Address
   - Investasi: 5000000
5. Click "Simpan Nasabah"
6. Verify percentage calculation
7. Check estimasi bagi hasil
```

#### 5c. Supplier
- [ ] Page loads
- [ ] Empty state or list shows

---

### 6. Sistem Testing ⚙️

#### 6a. Pengaturan
- [ ] Settings form displays
- [ ] All fields editable
- [ ] Default values show
- [ ] Save works
- [ ] Validation works

#### Steps:
```
1. Go to /sistem/pengaturan
2. Update fields:
   - Nama Toko: Test Store
   - Diskon Member: 10
   - Persen Nasabah: 35
   - Persen Pengelola: 65
3. Click "Simpan Pengaturan"
4. Verify success message
```

---

## Integration Testing

### Complete Transaction Flow

```
Test: Complete sale from product to profit distribution

Steps:
1. Add new product (Inventori → Barang Masuk)
   - Kode: TEST001
   - Nama: Test Product
   - Harga Beli: 10000
   - Harga Jual: 15000
   - Stok: 10

2. Create member (Master → Member)
   - Nama: Test Member
   - Get member code

3. Make sale (Kasir)
   - Add TEST001 to cart (qty: 2)
   - Select Test Member
   - Verify discount applied
   - Pay Rp 30000
   - Complete transaction

4. Verify results:
   - Stock decreased to 8
   - Transaction in Penjualan list
   - Profit calculation in Distribusi
   - Member discount applied

Expected Results:
- Subtotal: Rp 30,000
- Discount (5%): Rp 1,500
- Total: Rp 28,500
- Profit: Rp 10,000 (2 × (15000 - 10000))
- Stock: 8 remaining
```

---

## Performance Testing

### Load Testing Checklist

- [ ] Dashboard loads in < 2 seconds
- [ ] Kasir page responsive
- [ ] Product search instant
- [ ] Cart updates smooth
- [ ] Transaction processes < 1 second
- [ ] Database queries optimized

### Test with Large Data:
```
1. Add 100+ products
2. Create 50+ members
3. Process 100+ transactions
4. Check page load times
5. Monitor database size
```

---

## Browser Compatibility

### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Browsers
- [ ] Chrome Mobile
- [ ] Safari iOS
- [ ] Samsung Internet

### Screen Sizes
- [ ] Desktop (1920×1080)
- [ ] Laptop (1366×768)
- [ ] Tablet (768×1024)
- [ ] Mobile (375×667)

---

## Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Tab order logical
- [ ] Focus indicators visible
- [ ] Form labels present
- [ ] Error messages clear
- [ ] Color contrast sufficient
- [ ] Screen reader compatible

---

## Security Testing

### Input Validation
- [ ] SQL injection attempts blocked
- [ ] XSS attempts sanitized
- [ ] Invalid data rejected
- [ ] Required fields enforced

### Test Cases:
```
1. Try SQL injection in search:
   Input: ' OR '1'='1
   Expected: Sanitized/blocked

2. Try XSS in product name:
   Input: <script>alert('xss')</script>
   Expected: Escaped/sanitized

3. Submit empty required fields:
   Expected: Validation error

4. Submit negative numbers:
   Expected: Validation error
```

---

## Database Testing

### Data Integrity
- [ ] Foreign keys enforced
- [ ] Cascading deletes work
- [ ] Unique constraints work
- [ ] Default values set

### Test Cases:
```
1. Delete product with sales:
   Expected: Prevented or cascaded

2. Create duplicate barcode:
   Expected: Error

3. Negative stock:
   Expected: Prevented

4. Invalid foreign key:
   Expected: Error
```

---

## Regression Testing

After each update, verify:
- [ ] Existing features still work
- [ ] No new bugs introduced
- [ ] Performance not degraded
- [ ] UI not broken

---

## Bug Report Template

```markdown
**Title**: Brief description

**Priority**: Critical / High / Medium / Low

**Environment**:
- OS: Windows 11
- Browser: Chrome 120
- Version: 1.0.0

**Steps to Reproduce**:
1. Go to...
2. Click on...
3. Enter...
4. See error

**Expected Result**:
What should happen

**Actual Result**:
What actually happened

**Screenshots**:
[Attach if applicable]

**Console Errors**:
[Paste console output]

**Additional Context**:
Any other relevant information
```

---

## Test Data

### Sample Products
```json
[
  {
    "kode": "TEST001",
    "nama": "Test Product 1",
    "hargaBeli": 5000,
    "hargaJual": 8000,
    "stok": 100
  },
  {
    "kode": "TEST002",
    "nama": "Test Product 2",
    "hargaBeli": 10000,
    "hargaJual": 15000,
    "stok": 50
  }
]
```

### Sample Members
```json
[
  {
    "nama": "Test Member 1",
    "telepon": "081234567890"
  },
  {
    "nama": "Test Member 2",
    "telepon": "081234567891"
  }
]
```

### Sample Transactions
```json
{
  "items": [
    {
      "barangId": "...",
      "qty": 2,
      "hargaJual": 8000
    }
  ],
  "memberId": "...",
  "metodeBayar": "Tunai",
  "bayar": 20000
}
```

---

## Automated Testing (Future)

### Unit Tests
```typescript
// Example: utils.test.ts
describe('formatRupiah', () => {
  it('formats number to IDR currency', () => {
    expect(formatRupiah(10000)).toBe('Rp 10.000');
  });
});
```

### Integration Tests
```typescript
// Example: api.test.ts
describe('POST /api/penjualan', () => {
  it('creates new sale', async () => {
    const response = await fetch('/api/penjualan', {
      method: 'POST',
      body: JSON.stringify(saleData)
    });
    expect(response.status).toBe(200);
  });
});
```

### E2E Tests (Playwright/Cypress)
```typescript
// Example: kasir.spec.ts
test('complete transaction flow', async ({ page }) => {
  await page.goto('/kasir');
  await page.click('[data-testid="product-1"]');
  await page.click('[data-testid="checkout"]');
  await page.fill('[data-testid="payment"]', '50000');
  await page.click('[data-testid="process"]');
  await expect(page.locator('.success')).toBeVisible();
});
```

---

## Testing Schedule

### Daily
- Smoke tests on critical paths
- Check error logs

### Weekly
- Full regression suite
- Performance checks
- Security scans

### Monthly
- Load testing
- Accessibility audit
- Browser compatibility

### Before Release
- Complete test suite
- User acceptance testing
- Security audit
- Performance benchmarks

---

## Quality Metrics

### Target Metrics
- Test Coverage: > 80%
- Page Load: < 2s
- API Response: < 500ms
- Error Rate: < 0.1%
- Uptime: > 99.9%

---

## Testing Tools

### Recommended Tools
- **Unit Testing**: Jest, Vitest
- **E2E Testing**: Playwright, Cypress
- **API Testing**: Postman, Insomnia
- **Performance**: Lighthouse, WebPageTest
- **Accessibility**: axe DevTools, WAVE
- **Security**: OWASP ZAP, Snyk

---

## Conclusion

Regular testing ensures:
- ✅ Features work as expected
- ✅ No regressions introduced
- ✅ Good user experience
- ✅ System reliability
- ✅ Data integrity

**Happy Testing!** 🧪
