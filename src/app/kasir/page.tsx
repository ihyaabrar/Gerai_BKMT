"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart";
import { useAuthStore } from "@/store/auth";
import { formatRupiah } from "@/lib/utils";
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
    const res = await fetch("/api/barang");
    const data = await res.json();
    setBarangList(data);
  };

  const fetchMember = async () => {
    const res = await fetch("/api/member");
    const data = await res.json();
    setMemberList(data);
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

      if (!res.ok) throw new Error();

      const data = await res.json();
      const receipt = {
        nomorTransaksi: data.nomorTransaksi,
        tanggal: new Date(),
        items: items.map((item) => ({
          nama: item.nama,
          qty: item.qty,
          harga: item.hargaJual,
          subtotal: item.hargaJual * item.qty,
        })),
        subtotal: getSubtotal(),
        diskon,
        total,
        bayar: bayarNum,
        kembalian,
        member: selectedMember?.nama,
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
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Kasir</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Cari barang atau scan barcode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <BarcodeScanner onScan={handleBarcodeScanned} />
            <Button
              variant={memberId ? "default" : "outline"}
              onClick={() => setShowMember(true)}
              className={memberId ? "bg-violet-600 hover:bg-violet-700" : ""}
            >
              <User className="mr-2 h-4 w-4" />
              {selectedMember ? selectedMember.nama : "Member"}
            </Button>
          </div>

          {filteredBarang.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Barang tidak ditemukan</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filteredBarang.map((barang) => (
                <Card
                  key={barang.id}
                  className={`cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${
                    barang.stok <= 0 ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  onClick={() => handleAddToCart(barang)}
                >
                  <CardContent className="p-4">
                    <p className="font-semibold text-sm leading-tight">{barang.nama}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{barang.kode}</p>
                    <p className="text-base font-bold text-emerald-600 mt-2">
                      {formatRupiah(barang.hargaJual)}
                    </p>
                    <p className={`text-xs mt-1 ${
                      barang.stok === 0 ? "text-red-600 font-medium" :
                      barang.stok <= 5 ? "text-amber-600" : "text-gray-400"
                    }`}>
                      {barang.stok === 0 ? "Habis" : `Stok: ${barang.stok}`}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Cart */}
        <Card className="h-fit sticky top-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Keranjang
              {items.length > 0 && (
                <span className="ml-auto bg-emerald-600 text-white text-xs rounded-full px-2 py-0.5">
                  {items.reduce((s, i) => s + i.qty, 0)}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Keranjang kosong</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 border-b pb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.nama}</p>
                      <p className="text-xs text-gray-500">{formatRupiah(item.hargaJual)}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="icon" variant="outline" className="h-6 w-6"
                        onClick={() => updateQty(item.id, item.qty - 1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-7 text-center text-sm font-medium">{item.qty}</span>
                      <Button size="icon" variant="outline" className="h-6 w-6"
                        onClick={() => updateQty(item.id, item.qty + 1)}
                        disabled={item.qty >= item.stok}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500 hover:text-red-700"
                      onClick={() => removeItem(item.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-1.5 border-t pt-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatRupiah(getSubtotal())}</span>
              </div>
              {diskon > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Diskon Member ({diskon}%)</span>
                  <span>-{formatRupiah(getSubtotal() * diskon / 100)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold border-t pt-1.5">
                <span>Total</span>
                <span className="text-emerald-600">{formatRupiah(getTotal())}</span>
              </div>
            </div>

            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700"
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

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="max-w-md" onClose={() => setShowPayment(false)}>
          <DialogHeader>
            <DialogTitle>Pembayaran</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
              <p className="text-sm text-gray-600">Total Bayar</p>
              <p className="text-3xl font-bold text-emerald-600">{formatRupiah(getTotal())}</p>
            </div>

            <div>
              <label className="text-sm font-medium">Metode Bayar</label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {["Tunai", "Transfer", "QRIS"].map((m) => (
                  <Button
                    key={m}
                    variant={metodeBayar === m ? "default" : "outline"}
                    className={metodeBayar === m ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                    onClick={() => setMetodeBayar(m)}
                  >
                    {m}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Jumlah Bayar</label>
              <Input
                type="number"
                value={bayar}
                onChange={(e) => setBayar(e.target.value)}
                placeholder="0"
                className="text-lg mt-1"
                autoFocus
              />
              <div className="grid grid-cols-4 gap-2 mt-2">
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
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600">Kembalian</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatRupiah(parseFloat(bayar) - getTotal())}
                </p>
              </div>
            )}

            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700"
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
            <Input
              placeholder="Cari nama atau kode member..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              autoFocus
            />
            <div className="space-y-2 max-h-80 overflow-y-auto">
              <Button variant="outline" className="w-full justify-start text-gray-500"
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
                <p className="text-center text-gray-400 py-4 text-sm">Member tidak ditemukan</p>
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
          <Button onClick={() => setShowReceipt(false)} className="w-full bg-emerald-600 hover:bg-emerald-700">
            Selesai
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
