"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/store/cart";
import { useAuthStore } from "@/store/auth";
import { cn, formatRupiah } from "@/lib/utils";
import { Search, Trash2, Plus, Minus, User, CreditCard, ShoppingCart } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PrintReceipt } from "@/components/PrintReceipt";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { toast } from "sonner";

interface Barang {
  id: string;
  kode: string;
  barcode?: string;
  nama: string;
  hargaJual: number;
  stok: number;
  kategori: string | null;
}

interface Member {
  id: string;
  kode: string;
  nama: string;
  poin: number;
}

export default function KasirPage() {
  const [barangList, setBarangList] = useState<Barang[]>([]);
  const [memberList, setMemberList] = useState<Member[]>([]);
  const [diskonMember, setDiskonMember] = useState(5);
  const [search, setSearch] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [showMember, setShowMember] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [bayar, setBayar] = useState("");
  const [metodeBayar, setMetodeBayar] = useState("Tunai");
  const [processing, setProcessing] = useState(false);

  const { items, addItem, removeItem, updateQty, setMember, clearCart, getTotal, getSubtotal, memberId, diskon } = useCartStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchBarang();
    fetchMember();
    fetchPengaturan();
  }, []);

  const fetchBarang = async () => {
    try {
      const res = await fetch("/api/barang");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBarangList(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Gagal memuat daftar barang");
    }
  };

  const fetchMember = async () => {
    try {
      const res = await fetch("/api/member");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMemberList(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Gagal memuat daftar member");
    }
  };

  const fetchPengaturan = async () => {
    try {
      const res = await fetch("/api/pengaturan");
      const data = await res.json();
      if (data.diskonMember) setDiskonMember(data.diskonMember);
    } catch {
      // use default
    }
  };

  const filteredBarang = barangList.filter(
    (b) =>
      b.nama.toLowerCase().includes(search.toLowerCase()) ||
      b.kode.toLowerCase().includes(search.toLowerCase()) ||
      b.barcode?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredMember = memberList.filter(
    (m) =>
      m.nama.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.kode.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const handleBarcodeScanned = (barcode: string) => {
    const barang = barangList.find((b) => b.barcode === barcode);
    if (barang) {
      handleAddToCart(barang);
    } else {
      toast.error("Barang tidak ditemukan");
    }
  };

  const handleAddToCart = (barang: Barang) => {
    if (barang.stok <= 0) {
      toast.error(`Stok ${barang.nama} habis`);
      return;
    }
    addItem(barang);
  };

  const handleSelectMember = (member: Member) => {
    setMember(member.id, diskonMember);
    setShowMember(false);
    setMemberSearch("");
    toast.success(`Member ${member.nama} dipilih — diskon ${diskonMember}%`);
  };

  const handleRemoveMember = () => {
    setMember(null, 0);
    toast.info("Member dihapus");
  };

  const handlePayment = async () => {
    const bayarNum = parseFloat(bayar);
    const total = getTotal();

    if (!bayar || isNaN(bayarNum)) {
      toast.error("Masukkan jumlah bayar");
      return;
    }
    if (bayarNum < total) {
      toast.error("Jumlah bayar kurang dari total");
      return;
    }

    setProcessing(true);
    try {
      const kembalian = bayarNum - total;
      const payload = {
        items,
        memberId,
        subtotal: getSubtotal(),
        diskon,
        total,
        bayar: bayarNum,
        kembalian,
        metodeBayar,
      };

      const res = await fetch("/api/penjualan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.error || "Gagal memproses pembayaran");
        return;
      }

      // Struk memakai angka hasil hitungan server (harga, diskon, total),
      // bukan angka dari keranjang, supaya struk selalu cocok dengan database.
      const receipt = {
        nomorTransaksi: data.nomorTransaksi,
        tanggal: new Date(data.tanggal ?? Date.now()),
        items: (data.detail ?? []).map((d: any) => ({
          nama: d.barang?.nama ?? "-",
          qty: d.qty,
          harga: d.hargaJual,
          subtotal: d.subtotal,
        })),
        subtotal: data.subtotal,
        diskon: data.diskon,
        total: data.total,
        bayar: data.bayar,
        kembalian: data.kembalian,
        member: data.member?.nama,
        kasir: user?.nama || "Kasir",
      };

      setReceiptData(receipt);
      setShowReceipt(true);
      clearCart();
      setShowPayment(false);
      setBayar("");
      fetchBarang();
      toast.success("Transaksi berhasil");
    } catch {
      toast.error("Gagal memproses pembayaran");
    } finally {
      setProcessing(false);
    }
  };

  const selectedMember = memberList.find((m) => m.id === memberId);

  return (
    <div className="space-y-5 pb-24 lg:pb-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-900">Kasir</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Proses transaksi penjualan dengan cepat, mudah, dan aman
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Product Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400" />
              <Input aria-label="Cari barang atau scan barcode..."
                placeholder="Cari produk, scan barcode, atau ketik nama..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11"
              />
            </div>
            <div className="flex gap-2">
              <BarcodeScanner onScan={handleBarcodeScanned} />
              <Button
                variant={memberId ? "default" : "outline"}
                onClick={() => setShowMember(true)}
                className="flex-1 sm:flex-none min-w-0"
              >
                <User className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">
                  {selectedMember ? selectedMember.nama : "Member"}
                </span>
              </Button>
            </div>
          </div>

          {filteredBarang.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Barang tidak ditemukan</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredBarang.map((barang) => {
                const habis = barang.stok <= 0;
                const menipis = !habis && barang.stok <= 5;
                return (
                  <button
                    key={barang.id}
                    type="button"
                    disabled={habis}
                    onClick={() => handleAddToCart(barang)}
                    className={cn(
                      "group text-left rounded-card border bg-white p-3.5 shadow-card transition-all",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
                      habis
                        ? "opacity-55 cursor-not-allowed border-slate-200"
                        : "border-brand-100/70 hover:-translate-y-0.5 hover:shadow-card-hover hover:border-brand-300"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-sm leading-snug text-brand-900 break-words">
                        {barang.nama}
                      </p>
                      {habis ? (
                        <Badge variant="destructive" className="shrink-0">Habis</Badge>
                      ) : menipis ? (
                        <Badge variant="warning" className="shrink-0">Menipis</Badge>
                      ) : null}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">{barang.kode}</p>
                    <div className="mt-3 flex items-end justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-base font-bold text-brand-700 break-words">
                          {formatRupiah(barang.hargaJual)}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Stok: {barang.stok}
                        </p>
                      </div>
                      {!habis && (
                        <span className="shrink-0 h-8 w-8 rounded-lg bg-brand-600 text-white flex items-center justify-center transition-colors group-hover:bg-brand-700">
                          <Plus className="h-4 w-4" />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Cart */}
        <Card className="h-fit lg:sticky lg:top-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <span className="h-8 w-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
                <ShoppingCart className="h-[18px] w-[18px]" />
              </span>
              Keranjang Belanja
              {items.length > 0 && (
                <Badge className="ml-auto">
                  {items.reduce((s, i) => s + i.qty, 0)} item
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <div className="h-14 w-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-3">
                  <ShoppingCart className="h-7 w-7 text-brand-300" />
                </div>
                <p className="text-sm font-medium text-slate-500">Keranjang kosong</p>
                <p className="text-xs mt-0.5">Pilih produk untuk mulai transaksi</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 rounded-xl bg-surface-sunken/60 p-2.5"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate text-brand-900">
                        {item.nama}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {formatRupiah(item.hargaJual)} &times; {item.qty} ={" "}
                        <span className="font-semibold text-brand-700">
                          {formatRupiah(item.hargaJual * item.qty)}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        aria-label={`Kurangi jumlah ${item.nama}`}
                        size="icon"
                        variant="outline"
                        className="h-7 w-7 rounded-lg"
                        onClick={() => updateQty(item.id, item.qty - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span
                        className="w-7 text-center text-sm font-bold text-brand-900"
                        aria-live="polite"
                        aria-label={`Jumlah ${item.nama}: ${item.qty}`}
                      >
                        {item.qty}
                      </span>
                      <Button
                        aria-label={`Tambah jumlah ${item.nama}`}
                        size="icon"
                        variant="outline"
                        className="h-7 w-7 rounded-lg"
                        onClick={() => updateQty(item.id, item.qty + 1)}
                        disabled={item.qty >= item.stok}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button aria-label={`Hapus ${item.nama} dari keranjang`} size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => removeItem(item.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2 border-t border-brand-100 pt-3.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({items.reduce((s, i) => s + i.qty, 0)} item)</span>
                <span className="font-medium">{formatRupiah(getSubtotal())}</span>
              </div>
              {diskon > 0 && (
                <div className="flex justify-between text-brand-600">
                  <span>Diskon Member ({diskon}%)</span>
                  <span className="font-medium">
                    -{formatRupiah((getSubtotal() * diskon) / 100)}
                  </span>
                </div>
              )}
            </div>

            <div className="rounded-xl bg-brand-deep px-4 py-3.5 flex items-center justify-between">
              <span className="text-sm font-semibold text-brand-100">
                Total Pembayaran
              </span>
              <span className="text-xl font-extrabold text-white">
                {formatRupiah(getTotal())}
              </span>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={() => setShowPayment(true)}
              disabled={items.length === 0}
            >
              <CreditCard className="mr-2 h-5 w-5" />
              Bayar
            </Button>
          </CardContent>
        </Card>
      </div>

      {/*
        Bar pembayaran melayang khusus mobile. Di layar kecil keranjang
        berada di bawah daftar produk, jadi tanpa ini kasir harus men-scroll
        melewati seluruh katalog setiap kali ingin menyelesaikan transaksi.
      */}
      {items.length > 0 && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-brand-100 shadow-[0_-6px_20px_-8px_rgba(14,59,38,0.25)] px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-500">
                {items.reduce((n, i) => n + i.qty, 0)} item
              </p>
              <p className="text-lg font-extrabold text-brand-700 truncate">
                {formatRupiah(getTotal())}
              </p>
            </div>
            <Button className="shrink-0" size="lg" onClick={() => setShowPayment(true)}>
              <CreditCard className="mr-2 h-5 w-5" />
              Bayar
            </Button>
          </div>
        </div>
      )}

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="max-w-md" onClose={() => setShowPayment(false)}>
          <DialogHeader>
            <DialogTitle>Pembayaran</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-xl bg-brand-deep px-4 py-4">
              <p className="text-sm text-brand-200">Total Bayar</p>
              <p className="text-3xl font-extrabold text-white mt-0.5">
                {formatRupiah(getTotal())}
              </p>
            </div>

            <div>
              <p id="label-metode-bayar" className="text-sm font-medium">
                Metode Bayar
              </p>
              <div
                role="group"
                aria-labelledby="label-metode-bayar"
                className="grid grid-cols-3 gap-2 mt-2"
              >
                {["Tunai", "Transfer", "QRIS"].map((m) => (
                  <Button
                    key={m}
                    variant={metodeBayar === m ? "default" : "outline"}
                    onClick={() => setMetodeBayar(m)}
                  >
                    {m}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="jumlah-bayar">Jumlah Bayar</label>
              <Input id="jumlah-bayar"
                type="number"
                value={bayar}
                onChange={(e) => setBayar(e.target.value)}
                placeholder="0"
                className="text-lg mt-1"
                autoFocus
              />
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mt-2">
                {[5000, 10000, 20000, 50000, 100000, 150000, 200000, 500000].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setBayar(amount.toString())}
                  >
                    {amount >= 1000 ? `${amount / 1000}k` : amount}
                  </Button>
                ))}
              </div>
            </div>

            {bayar && parseFloat(bayar) >= getTotal() && (
              <div className="bg-brand-50 p-3 rounded-lg border border-brand-200">
                <p className="text-sm text-slate-600">Kembalian</p>
                <p className="text-2xl font-bold text-brand-600">
                  {formatRupiah(parseFloat(bayar) - getTotal())}
                </p>
              </div>
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={handlePayment}
              disabled={processing}
            >
              {processing ? "Memproses..." : "Proses Pembayaran"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Member Dialog */}
      <Dialog open={showMember} onOpenChange={(v) => { setShowMember(v); if (!v) setMemberSearch(""); }}>
        <DialogContent className="max-w-md" onClose={() => setShowMember(false)}>
          <DialogHeader>
            <DialogTitle>Pilih Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input aria-label="Cari nama atau kode member..."
              placeholder="Cari nama atau kode member..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              autoFocus
            />
            <div className="space-y-2 max-h-80 overflow-y-auto">
              <Button variant="outline" className="w-full justify-start text-slate-500"
                onClick={handleRemoveMember}>
                Tanpa Member
              </Button>
              {filteredMember.map((member) => (
                <Button
                  key={member.id}
                  variant={memberId === member.id ? "default" : "outline"}
                  className={`w-full justify-start ${memberId === member.id ? "bg-violet-600 hover:bg-violet-700" : ""}`}
                  onClick={() => handleSelectMember(member)}
                >
                  <div className="text-left">
                    <p className="font-medium">{member.nama}</p>
                    <p className="text-xs opacity-70">{member.kode} · Poin: {member.poin}</p>
                  </div>
                </Button>
              ))}
              {filteredMember.length === 0 && (
                <p className="text-center text-slate-400 py-4 text-sm">Member tidak ditemukan</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Transaksi Berhasil</DialogTitle>
          </DialogHeader>
          {receiptData && <PrintReceipt data={receiptData} />}
          <Button onClick={() => setShowReceipt(false)} className="w-full">
            Selesai
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
