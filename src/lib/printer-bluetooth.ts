/**
 * Mengirim struk langsung ke printer thermal Bluetooth (Web Bluetooth).
 *
 * Batasan yang perlu diketahui pengurus:
 * - Hanya Chrome/Edge di Android, Windows, Mac, dan ChromeOS. Safari dan
 *   semua browser di iPhone/iPad tidak mendukung Web Bluetooth — di sana
 *   pakai metode "printer sistem".
 * - Hanya printer Bluetooth Low Energy (BLE). Kebanyakan printer thermal
 *   murah 58 mm mendukungnya; printer Bluetooth Classic lama tidak.
 * - Memilih printer harus lewat klik (aturan browser). Setelah itu koneksi
 *   dipakai ulang selama tab terbuka.
 */

/**
 * Layanan GATT yang dipakai printer thermal umum. Browser hanya mengizinkan
 * akses ke layanan yang disebut di sini.
 */
const LAYANAN_PRINTER = [
  "000018f0-0000-1000-8000-00805f9b34fb", // mayoritas printer 58 mm (MTP-II, RPP02N, dll.)
  "0000ff00-0000-1000-8000-00805f9b34fb",
  "0000ffe0-0000-1000-8000-00805f9b34fb",
  "0000fee7-0000-1000-8000-00805f9b34fb",
  "49535343-fe7d-4ae5-8fa9-9fafd205e455", // modul ISSC/Microchip
  "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
];

/**
 * Byte per tulis. 100 byte cepat dan diterima kebanyakan printer; printer
 * yang MTU-nya kecil hanya menerima 20 byte, jadi pengiriman turun ke ukuran
 * itu bila tulis pertama gagal.
 */
const POTONGAN_BESAR = 100;
const POTONGAN_KECIL = 20;

let perangkat: BluetoothDevice | null = null;
let karakteristik: BluetoothRemoteGATTCharacteristic | null = null;
/** Ukuran potongan yang terbukti berhasil untuk printer yang tersambung. */
let potongan = POTONGAN_BESAR;

type PendengarStatus = (tersambung: boolean) => void;
const pendengar = new Set<PendengarStatus>();

/** Beri tahu halaman saat printer tersambung atau terputus (mis. dimatikan). */
export function pantauPrinter(fn: PendengarStatus): () => void {
  pendengar.add(fn);
  return () => {
    pendengar.delete(fn);
  };
}

function kabari() {
  const status = printerTersambung();
  pendengar.forEach((fn) => fn(status));
}

function saatTerputus() {
  karakteristik = null;
  kabari();
}

function pakaiPerangkat(d: BluetoothDevice, c: BluetoothRemoteGATTCharacteristic) {
  if (perangkat && perangkat !== d) perangkat.removeEventListener("gattserverdisconnected", saatTerputus);
  if (perangkat !== d) {
    d.addEventListener("gattserverdisconnected", saatTerputus);
    potongan = POTONGAN_BESAR;
  }
  perangkat = d;
  karakteristik = c;
  kabari();
}

export class PrinterBluetoothError extends Error {}

export function bluetoothDidukung(): boolean {
  return typeof navigator !== "undefined" && Boolean(navigator.bluetooth);
}

export function printerTersambung(): boolean {
  return Boolean(perangkat?.gatt?.connected && karakteristik);
}

async function cariKarakteristik(d: BluetoothDevice): Promise<BluetoothRemoteGATTCharacteristic> {
  if (!d.gatt) throw new PrinterBluetoothError("Perangkat ini tidak bisa disambungkan.");
  const server = d.gatt.connected ? d.gatt : await d.gatt.connect();
  // Layanan printer yang dikenal didahulukan: sebagian printer juga punya
  // layanan lain yang bisa ditulisi (mis. pengaturan), dan menulis struk ke
  // sana tidak mencetak apa pun.
  const layanan = await server.getPrimaryServices();
  const urut = [...layanan].sort(
    (a, b) => urutanLayanan(a.uuid) - urutanLayanan(b.uuid)
  );
  for (const l of urut) {
    const daftar = await l.getCharacteristics();
    const tulis =
      daftar.find((c) => c.properties.writeWithoutResponse) ?? daftar.find((c) => c.properties.write);
    if (tulis) return tulis;
  }
  throw new PrinterBluetoothError(
    "Perangkat tersambung, tetapi bukan printer yang dikenali. Pastikan yang dipilih adalah printer thermal."
  );
}

function urutanLayanan(uuid: string): number {
  const i = LAYANAN_PRINTER.indexOf(uuid.toLowerCase());
  return i === -1 ? LAYANAN_PRINTER.length : i;
}

/** Buka pemilih perangkat Bluetooth. Harus dipanggil dari klik pengguna. */
export async function pilihPrinter(): Promise<{ id: string; nama: string }> {
  if (!bluetoothDidukung()) {
    throw new PrinterBluetoothError(
      "Browser ini tidak mendukung Bluetooth langsung. Gunakan Chrome di Android atau komputer, atau pilih metode printer sistem."
    );
  }
  let d: BluetoothDevice;
  try {
    d = await navigator.bluetooth!.requestDevice({
      acceptAllDevices: true,
      optionalServices: LAYANAN_PRINTER,
    });
  } catch (e) {
    if (e instanceof Error && e.name === "NotFoundError") {
      throw new PrinterBluetoothError("Tidak ada printer yang dipilih.");
    }
    throw new PrinterBluetoothError("Bluetooth tidak bisa dibuka. Pastikan Bluetooth perangkat ini menyala.");
  }
  try {
    pakaiPerangkat(d, await cariKarakteristik(d));
  } catch (e) {
    if (e instanceof PrinterBluetoothError) throw e;
    throw new PrinterBluetoothError(
      "Printer terpilih tetapi tidak bisa disambungkan. Pastikan printer menyala, tidak sedang tersambung ke HP lain, lalu coba lagi."
    );
  }
  return { id: d.id, nama: d.name || "Printer Bluetooth" };
}

/**
 * Sambungkan kembali tanpa membuka pemilih: perangkat yang sama di tab ini,
 * atau perangkat yang pernah diizinkan (bila browser mendukung getDevices).
 */
export async function sambungUlang(idTersimpan?: string | null): Promise<boolean> {
  if (!bluetoothDidukung()) return false;
  try {
    if (perangkat) {
      pakaiPerangkat(perangkat, await cariKarakteristik(perangkat));
      return true;
    }
    if (idTersimpan && navigator.bluetooth!.getDevices) {
      const dikenal = await navigator.bluetooth!.getDevices();
      const d = dikenal.find((x) => x.id === idTersimpan);
      if (d) {
        pakaiPerangkat(d, await cariKarakteristik(d));
        return true;
      }
    }
  } catch {
    // Printer mati atau di luar jangkauan.
  }
  return false;
}

export function putuskanPrinter(): void {
  perangkat?.removeEventListener("gattserverdisconnected", saatTerputus);
  perangkat?.gatt?.disconnect();
  perangkat = null;
  karakteristik = null;
  kabari();
}

/** Kirim byte ESC/POS ke printer yang tersambung. */
export async function kirimKePrinter(byte: Uint8Array): Promise<void> {
  // Printer yang sempat dimatikan lalu dinyalakan lagi: sambungkan ulang
  // diam-diam sebelum menyerah.
  if (!printerTersambung() && perangkat) await sambungUlang();
  if (!karakteristik) throw new PrinterBluetoothError("Printer Bluetooth belum tersambung.");

  let i = 0;
  let sudahTurun = false;
  while (i < byte.length) {
    const c = karakteristik;
    if (!c) throw new PrinterBluetoothError("Pengiriman ke printer terputus. Dekatkan printer dan coba lagi.");
    const bagian = byte.slice(i, i + potongan);
    try {
      await tulis(c, bagian);
      i += bagian.length;
    } catch {
      // Tulis pertama gagal dengan potongan besar: kemungkinan MTU printer
      // kecil. Ulangi potongan yang sama dengan ukuran 20 byte.
      if (potongan > POTONGAN_KECIL && !sudahTurun && perangkat?.gatt?.connected) {
        potongan = POTONGAN_KECIL;
        sudahTurun = true;
        continue;
      }
      karakteristik = null;
      kabari();
      throw new PrinterBluetoothError("Pengiriman ke printer terputus. Dekatkan printer dan coba lagi.");
    }
  }
}

async function tulis(c: BluetoothRemoteGATTCharacteristic, bagian: Uint8Array<ArrayBuffer>) {
  if (c.properties.writeWithoutResponse && typeof c.writeValueWithoutResponse === "function") {
    await c.writeValueWithoutResponse(bagian);
    // Beri napas pada buffer printer; tanpa jeda sebagian baris hilang.
    await new Promise((r) => setTimeout(r, bagian.length > POTONGAN_KECIL ? 25 : 8));
  } else {
    await c.writeValue(bagian);
  }
}
